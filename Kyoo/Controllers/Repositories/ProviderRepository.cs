using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class ProviderRepository : LocalRepository<ProviderID>, IProviderRepository
	{
		private readonly DatabaseContext _database;
		protected override Expression<Func<ProviderID, object>> DefaultSort => x => x.Slug;


		public ProviderRepository(DatabaseContext database) : base(database)
		{
			_database = database;
		}

		public async Task<ICollection<ProviderID>> Search(string query)
		{
			return await _database.Providers
				.Where(x => EF.Functions.ILike(x.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public override async Task<ProviderID> Create(ProviderID obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			if (obj.Slug == null)
				throw new ArgumentException($"Provider's slug can't be null (name: {obj.Name}).");

			_database.Entry(obj).State = EntityState.Added;

			await _database.SaveChangesAsync($"Trying to insert a duplicated provider (slug {obj.Slug} already exists).");
			return obj;
		}

		public override async Task Delete(ProviderID obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			// TODO handle ExternalID deletion when they refer to this providerID.
			await _database.SaveChangesAsync();
		}
	}
}