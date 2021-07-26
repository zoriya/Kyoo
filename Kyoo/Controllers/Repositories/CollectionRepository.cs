using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	/// <summary>
	/// A local repository to handle collections
	/// </summary>
	public class CollectionRepository : LocalRepository<Collection>, ICollectionRepository
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;
		
		/// <summary>
		/// A provider repository to handle externalID creation and deletion
		/// </summary>
		private readonly IProviderRepository _providers;
		
		/// <inheritdoc />
		protected override Expression<Func<Collection, object>> DefaultSort => x => x.Name;

		/// <summary>
		/// Create a new <see cref="CollectionRepository"/>.
		/// </summary>
		/// <param name="database">The database handle to use</param>
		/// /// <param name="providers">A provider repository</param>
		public CollectionRepository(DatabaseContext database, IProviderRepository providers)
			: base(database)
		{
			_database = database;
			_providers = providers;
		}

		/// <inheritdoc />
		public override async Task<ICollection<Collection>> Search(string query)
		{
			return await _database.Collections
				.Where(_database.Like<Collection>(x => x.Name, $"%{query}%"))
				.OrderBy(DefaultSort)
				.Take(20)
				.ToListAsync();
		}

		/// <inheritdoc />
		public override async Task<Collection> Create(Collection obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			obj.ExternalIDs.ForEach(x => _database.Entry(x).State = EntityState.Added);
			await _database.SaveChangesAsync($"Trying to insert a duplicated collection (slug {obj.Slug} already exists).");
			return obj;
		}
		
		/// <inheritdoc />
		protected override async Task Validate(Collection resource)
		{
			await base.Validate(resource);
			await resource.ExternalIDs.ForEachAsync(async x => 
			{ 
				x.Provider = await _providers.CreateIfNotExists(x.Provider);
				x.ProviderID = x.Provider.ID;
				x.ResourceType = nameof(Collection);
				_database.Entry(x.Provider).State = EntityState.Detached;
			});
		}
		
		/// <inheritdoc />
		protected override async Task EditRelations(Collection resource, Collection changed, bool resetOld)
		{
			if (changed.ExternalIDs != null || resetOld)
			{
				await Database.Entry(resource).Collection(x => x.ExternalIDs).LoadAsync();
				resource.ExternalIDs = changed.ExternalIDs;
			}

			await base.EditRelations(resource, changed, resetOld);
		}

		/// <inheritdoc />
		public override async Task Delete(Collection obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}
	}
}