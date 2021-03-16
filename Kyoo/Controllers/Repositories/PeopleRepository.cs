using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Controllers
{
	public class PeopleRepository : LocalRepository<People>, IPeopleRepository
	{
		private bool _disposed;
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;
		private readonly Lazy<IShowRepository> _shows;
		protected override Expression<Func<People, object>> DefaultSort => x => x.Name;

		public PeopleRepository(DatabaseContext database, IProviderRepository providers, IServiceProvider services) 
			: base(database)
		{
			_database = database;
			_providers = providers;
			_shows = new Lazy<IShowRepository>(services.GetRequiredService<IShowRepository>);
		}


		public override void Dispose()
		{
			if (_disposed)
				return;
			_disposed = true;
			_database.Dispose();
			_providers.Dispose();
			if (_shows.IsValueCreated)
				_shows.Value.Dispose();
			GC.SuppressFinalize(this);
		}

		public override async ValueTask DisposeAsync()
		{
			if (_disposed)
				return;
			_disposed = true;
			await _database.DisposeAsync();
			await _providers.DisposeAsync();
			if (_shows.IsValueCreated)
				await _shows.Value.DisposeAsync();
		}

		public override async Task<ICollection<People>> Search(string query)
		{
			return await _database.People
				.Where(people => EF.Functions.ILike(people.Name, $"%{query}%"))
				.OrderBy(DefaultSort)
				.Take(20)
				.ToListAsync();
		}

		public override async Task<People> Create(People obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			obj.ExternalIDs.ForEach(x => _database.Entry(x).State = EntityState.Added);
			await _database.SaveChangesAsync($"Trying to insert a duplicated people (slug {obj.Slug} already exists).");
			return obj;
		}

		protected override async Task Validate(People resource)
		{
			await base.Validate(resource);
			await resource.ExternalIDs.ForEachAsync(async id =>
			{
				id.ProviderID = (await _providers.CreateIfNotExists(id.Provider, true)).ID;
				id.Provider = null;

			});
			await resource.Roles.ForEachAsync(async role =>
			{
				role.ShowID = (await _shows.Value.CreateIfNotExists(role.Show, true)).ID;
				role.Show = null;
			});
		}

		protected override async Task EditRelations(People resource, People changed, bool resetOld)
		{
			if (changed.Roles != null || resetOld)
			{
				await Database.Entry(resource).Collection(x => x.Roles).LoadAsync();
				resource.Roles = changed.Roles;
			}

			if (changed.ExternalIDs != null || resetOld)
			{
				await Database.Entry(resource).Collection(x => x.ExternalIDs).LoadAsync();
				resource.ExternalIDs = changed.ExternalIDs;
				
			}
			await base.EditRelations(resource, changed, resetOld);
		}

		public override async Task Delete(People obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			obj.ExternalIDs.ForEach(x => _database.Entry(x).State = EntityState.Deleted);
			obj.Roles.ForEach(x => _database.Entry(x).State = EntityState.Deleted);
			await _database.SaveChangesAsync();
		}

		public async Task<ICollection<PeopleRole>> GetFromShow(int showID, 
			Expression<Func<PeopleRole, bool>> where = null, 
			Sort<PeopleRole> sort = default, 
			Pagination limit = default)
		{
			ICollection<PeopleRole> people = await ApplyFilters(_database.PeopleRoles
					.Where(x => x.ShowID == showID)
					.Include(x => x.People),
				id => _database.PeopleRoles.FirstOrDefaultAsync(x => x.ID == id),
				x => x.People.Name,
				where,
				sort,
				limit);
			if (!people.Any() && await _shows.Value.Get(showID) == null)
				throw new ItemNotFound();
			foreach (PeopleRole role in people)
				role.ForPeople = true;
			return people;
		}

		public async Task<ICollection<PeopleRole>> GetFromShow(string showSlug,
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default, 
			Pagination limit = default)
		{
			ICollection<PeopleRole> people = await ApplyFilters(_database.PeopleRoles
					.Where(x => x.Show.Slug == showSlug)
					.Include(x => x.People)
					.Include(x => x.Show),
				id => _database.PeopleRoles.FirstOrDefaultAsync(x => x.ID == id),
				x => x.People.Name,
				where,
				sort,
				limit);
			if (!people.Any() && await _shows.Value.Get(showSlug) == null)
				throw new ItemNotFound();
			foreach (PeopleRole role in people)
				role.ForPeople = true;
			return people;
		}
		
		public async Task<ICollection<PeopleRole>> GetFromPeople(int peopleID,
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default, 
			Pagination limit = default)
		{
			ICollection<PeopleRole> roles = await ApplyFilters(_database.PeopleRoles
					.Where(x => x.PeopleID == peopleID)
					.Include(x => x.Show),
				id => _database.PeopleRoles.FirstOrDefaultAsync(x => x.ID == id),
				x => x.Show.Title,
				where,
				sort,
				limit);
			if (!roles.Any() && await Get(peopleID) == null)
				throw new ItemNotFound();
			return roles;
		}
		
		public async Task<ICollection<PeopleRole>> GetFromPeople(string slug,
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default, 
			Pagination limit = default)
		{
			ICollection<PeopleRole> roles = await ApplyFilters(_database.PeopleRoles
					.Where(x => x.People.Slug == slug)
					.Include(x => x.Show),
				id => _database.PeopleRoles.FirstOrDefaultAsync(x => x.ID == id),
				x => x.Show.Title,
				where,
				sort,
				limit);
			if (!roles.Any() && await Get(slug) == null)
				throw new ItemNotFound();
			return roles;
		}
	}
}