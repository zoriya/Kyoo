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
		
		/// <inheritdoc />
		protected override Expression<Func<Collection, object>> DefaultSort => x => x.Name;

		/// <summary>
		/// Create a new <see cref="CollectionRepository"/>.
		/// </summary>
		/// <param name="database">The database handle to use</param>
		public CollectionRepository(DatabaseContext database)
			: base(database)
		{
			_database = database;
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
			await _database.SaveChangesAsync($"Trying to insert a duplicated collection (slug {obj.Slug} already exists).");
			return obj;
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