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
	/// A local repository to handle studios
	/// </summary>
	public class StudioRepository : LocalRepository<Studio>, IStudioRepository
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
		protected override Expression<Func<Studio, object>> DefaultSort => x => x.Name;


		/// <summary>
		/// Create a new <see cref="StudioRepository"/>.
		/// </summary>
		/// <param name="database">The database handle</param>
		/// <param name="providers">A provider repository</param>
		public StudioRepository(DatabaseContext database, IProviderRepository providers)
			: base(database)
		{
			_database = database;
			_providers = providers;
		}
		
		/// <inheritdoc />
		public override async Task<ICollection<Studio>> Search(string query)
		{
			return await _database.Studios
				.Where(_database.Like<Studio>(x => x.Name, $"%{query}%"))
				.OrderBy(DefaultSort)
				.Take(20)
				.ToListAsync();
		}

		/// <inheritdoc />
		public override async Task<Studio> Create(Studio obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			obj.ExternalIDs.ForEach(x => _database.MetadataIds<Studio>().Attach(x));
			await _database.SaveChangesAsync($"Trying to insert a duplicated studio (slug {obj.Slug} already exists).");
			return obj;
		}
		
		/// <inheritdoc />
		protected override async Task Validate(Studio resource)
		{
			await base.Validate(resource);
			await resource.ExternalIDs.ForEachAsync(async x => 
			{ 
				x.Provider = await _providers.CreateIfNotExists(x.Provider);
				x.ProviderID = x.Provider.ID;
				_database.Entry(x.Provider).State = EntityState.Detached;
			});
		}
		
		/// <inheritdoc />
		protected override async Task EditRelations(Studio resource, Studio changed, bool resetOld)
		{
			if (changed.ExternalIDs != null || resetOld)
			{
				await Database.Entry(resource).Collection(x => x.ExternalIDs).LoadAsync();
				resource.ExternalIDs = changed.ExternalIDs;
			}

			await base.EditRelations(resource, changed, resetOld);
		}

		/// <inheritdoc />
		public override async Task Delete(Studio obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}
	}
}