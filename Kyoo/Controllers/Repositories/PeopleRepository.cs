using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	/// <summary>
	/// A local repository to handle people.
	/// </summary>
	public class PeopleRepository : LocalRepository<People>, IPeopleRepository
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;
		/// <summary>
		/// A provider repository to handle externalID creation and deletion
		/// </summary>
		private readonly IProviderRepository _providers;
		/// <summary>
		/// A lazy loaded show repository to validate requests from shows.
		/// </summary>
		private readonly Lazy<IShowRepository> _shows;
		
		/// <inheritdoc />
		protected override Expression<Func<People, object>> DefaultSort => x => x.Name;

		/// <summary>
		/// Create a new <see cref="PeopleRepository"/>
		/// </summary>
		/// <param name="database">The database handle</param>
		/// <param name="providers">A provider repository</param>
		/// <param name="shows">A lazy loaded show repository</param>
		public PeopleRepository(DatabaseContext database,
			IProviderRepository providers,
			Lazy<IShowRepository> shows) 
			: base(database)
		{
			_database = database;
			_providers = providers;
			_shows = shows;
		}
		

		/// <inheritdoc />
		public override async Task<ICollection<People>> Search(string query)
		{
			return await _database.People
				.Where(_database.Like<People>(x => x.Name, $"%{query}%"))
				.OrderBy(DefaultSort)
				.Take(20)
				.ToListAsync();
		}

		/// <inheritdoc />
		public override async Task<People> Create(People obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync($"Trying to insert a duplicated people (slug {obj.Slug} already exists).");
			return obj;
		}

		/// <inheritdoc />
		protected override async Task Validate(People resource)
		{
			await base.Validate(resource);

			if (resource.ExternalIDs != null)
			{
				foreach (MetadataID id in resource.ExternalIDs)
				{
					id.Provider = _database.LocalEntity<Provider>(id.Provider.Slug)
						?? await _providers.CreateIfNotExists(id.Provider);
					id.ProviderID = id.Provider.ID;
				}
				_database.MetadataIds<People>().AttachRange(resource.ExternalIDs);
			}

			if (resource.Roles != null)
			{
				foreach (PeopleRole role in resource.Roles)
				{
					role.Show = _database.LocalEntity<Show>(role.Show.Slug) 
						?? await _shows.Value.CreateIfNotExists(role.Show);
					role.ShowID = role.Show.ID;
					_database.Entry(role).State = EntityState.Added;
				}
			}
		}

		/// <inheritdoc />
		protected override async Task EditRelations(People resource, People changed, bool resetOld)
		{
			await Validate(changed);
			
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
		}

		/// <inheritdoc />
		public override async Task Delete(People obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			obj.ExternalIDs.ForEach(x => _database.Entry(x).State = EntityState.Deleted);
			obj.Roles.ForEach(x => _database.Entry(x).State = EntityState.Deleted);
			await _database.SaveChangesAsync();
		}

		/// <inheritdoc />
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
			if (!people.Any() && await _shows.Value.GetOrDefault(showID) == null)
				throw new ItemNotFoundException();
			foreach (PeopleRole role in people)
				role.ForPeople = true;
			return people;
		}

		/// <inheritdoc />
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
			if (!people.Any() && await _shows.Value.GetOrDefault(showSlug) == null)
				throw new ItemNotFoundException();
			foreach (PeopleRole role in people)
				role.ForPeople = true;
			return people;
		}
		
		/// <inheritdoc />
		public async Task<ICollection<PeopleRole>> GetFromPeople(int id,
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default, 
			Pagination limit = default)
		{
			ICollection<PeopleRole> roles = await ApplyFilters(_database.PeopleRoles
					.Where(x => x.PeopleID == id)
					.Include(x => x.Show),
				y => _database.PeopleRoles.FirstOrDefaultAsync(x => x.ID == y),
				x => x.Show.Title,
				where,
				sort,
				limit);
			if (!roles.Any() && await GetOrDefault(id) == null)
				throw new ItemNotFoundException();
			return roles;
		}
		
		/// <inheritdoc />
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
			if (!roles.Any() && await GetOrDefault(slug) == null)
				throw new ItemNotFoundException();
			return roles;
		}
	}
}