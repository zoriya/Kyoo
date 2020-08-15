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
			_database.Dispose();
			_providers.Dispose();
			if (_shows.IsValueCreated)
				_shows.Value.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			await _database.DisposeAsync();
			await _providers.DisposeAsync();
			if (_shows.IsValueCreated)
				await _shows.Value.DisposeAsync();
		}

		public async Task<ICollection<People>> Search(string query)
		{
			return await _database.People
				.Where(people => EF.Functions.ILike(people.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public override async Task<People> Create(People obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			await Validate(obj);
			_database.Entry(obj).State = EntityState.Added;
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Added;
			
			await _database.SaveChangesAsync($"Trying to insert a duplicated people (slug {obj.Slug} already exists).");
			return obj;
		}

		protected override async Task Validate(People obj)
		{
			await base.Validate(obj);
			
			if (obj.ExternalIDs != null)
				foreach (MetadataID link in obj.ExternalIDs)
					link.Provider = await _providers.CreateIfNotExists(link.Provider);
		}
		
		public override async Task Delete(People obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Deleted;
			if (obj.Roles != null)
				foreach (PeopleRole link in obj.Roles)
					_database.Entry(link).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}

		public async Task<ICollection<PeopleRole>> GetFromShow(int showID, 
			Expression<Func<PeopleRole, bool>> where = null, 
			Sort<PeopleRole> sort = default, 
			Pagination limit = default)
		{
			if (sort.Key?.Body is MemberExpression member)
			{
				sort.Key = member.Member.Name switch
				{
					"Name" => x => x.People.Name,
					"Slug" => x => x.People.Slug,
					_ => sort.Key
				};
			}

			ICollection<PeopleRole> people = await ApplyFilters(_database.PeopleRoles.Where(x => x.ShowID == showID),
				id => _database.PeopleRoles.FirstOrDefaultAsync(x => x.ID == id),
				x => x.People.Name,
				where,
				sort,
				limit);
			if (!people.Any() && await _shows.Value.Get(showID) == null)
				throw new ItemNotFound();
			return people;
		}

		public async Task<ICollection<PeopleRole>> GetFromShow(string showSlug,
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default, 
			Pagination limit = default)
		{
			if (sort.Key?.Body is MemberExpression member)
			{
				sort.Key = member.Member.Name switch
				{
					"Name" => x => x.People.Name,
					"Slug" => x => x.People.Slug,
					_ => sort.Key
				};
			}
			
			ICollection<PeopleRole> people = await ApplyFilters(_database.PeopleRoles.Where(x => x.Show.Slug == showSlug),
				id => _database.PeopleRoles.FirstOrDefaultAsync(x => x.ID == id),
				x => x.People.Name,
				where,
				sort,
				limit);
			if (!people.Any() && await _shows.Value.Get(showSlug) == null)
				throw new ItemNotFound();
			return people;
		}
		
		public async Task<ICollection<ShowRole>> GetFromPeople(int peopleID,
			Expression<Func<ShowRole, bool>> where = null,
			Sort<ShowRole> sort = default, 
			Pagination limit = default)
		{
			ICollection<ShowRole> roles = await ApplyFilters(_database.PeopleRoles.Where(x => x.PeopleID == peopleID)
					.Select(ShowRole.FromPeopleRole),
				async id => new ShowRole(await _database.PeopleRoles.FirstOrDefaultAsync(x => x.ID == id)),
				x => x.Title,
				where,
				sort,
				limit);
			if (!roles.Any() && await Get(peopleID) == null)
				throw new ItemNotFound();
			return roles;
		}
		
		public async Task<ICollection<ShowRole>> GetFromPeople(string slug,
			Expression<Func<ShowRole, bool>> where = null,
			Sort<ShowRole> sort = default, 
			Pagination limit = default)
		{
			ICollection<ShowRole> roles = await ApplyFilters(_database.PeopleRoles.Where(x => x.People.Slug == slug)
					.Select(ShowRole.FromPeopleRole),
				async id => new ShowRole(await _database.PeopleRoles.FirstOrDefaultAsync(x => x.ID == id)),
				x => x.Title,
				where,
				sort,
				limit);
			if (!roles.Any() && await Get(slug) == null)
				throw new ItemNotFound();
			return roles;
		}
	}
}