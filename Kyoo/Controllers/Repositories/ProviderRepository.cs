using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Database;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	/// <summary>
	///     A local repository to handle providers.
	/// </summary>
	public class ProviderRepository : LocalRepository<Provider>, IProviderRepository
	{
		/// <summary>
		///     The database handle
		/// </summary>
		private readonly DatabaseContext _database;


		/// <summary>
		///     Create a new <see cref="ProviderRepository" />.
		/// </summary>
		/// <param name="database">The database handle</param>
		public ProviderRepository(DatabaseContext database)
			: base(database)
		{
			_database = database;
		}

		/// <inheritdoc />
		protected override Expression<Func<Provider, object>> DefaultSort => x => x.Slug;

		/// <inheritdoc />
		public override async Task<ICollection<Provider>> Search(string query)
		{
			return await _database.Providers
				.Where(_database.Like<Provider>(x => x.Name, $"%{query}%"))
				.OrderBy(DefaultSort)
				.Take(20)
				.ToListAsync();
		}

		/// <inheritdoc />
		public override async Task<Provider> Create(Provider obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync("Trying to insert a duplicated provider " +
				$"(slug {obj.Slug} already exists).");
			return obj;
		}

		/// <inheritdoc />
		public override async Task Delete(Provider obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}

		/// <inheritdoc />
		public Task<ICollection<MetadataID>> GetMetadataID<T>(Expression<Func<MetadataID, bool>> where = null,
			Sort<MetadataID> sort = default,
			Pagination limit = default)
			where T : class, IMetadata
		{
			return ApplyFilters(_database.MetadataIds<T>()
					.Include(y => y.Provider),
				x => _database.MetadataIds<T>().FirstOrDefaultAsync(y => y.ResourceID == x),
				x => x.ResourceID,
				where,
				sort,
				limit);
		}
	}
}