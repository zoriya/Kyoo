using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class CollectionRepository : LocalRepository<Collection>, ICollectionRepository
	{
		private bool _disposed;
		private readonly DatabaseContext _database;
		protected override Expression<Func<Collection, object>> DefaultSort => x => x.Name;

		public CollectionRepository(DatabaseContext database) : base(database)
		{
			_database = database;
		}

		public override void Dispose()
		{
			if (_disposed)
				return;
			_disposed = true;
			_database.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			if (_disposed)
				return;
			_disposed = true;
			await _database.DisposeAsync();
		}
		
		public override async Task<ICollection<Collection>> Search(string query)
		{
			return await _database.Collections
				.Where(x => EF.Functions.ILike(x.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public override async Task<Collection> Create(Collection obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync($"Trying to insert a duplicated collection (slug {obj.Slug} already exists).");
			return obj;
		}

		public override async Task Delete(Collection obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}
	}
}