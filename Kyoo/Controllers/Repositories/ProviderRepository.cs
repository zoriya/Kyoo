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
	public class ProviderRepository : LocalRepository<ProviderID>, IProviderRepository
	{
		private readonly DatabaseContext _database;
		protected override Expression<Func<ProviderID, object>> DefaultSort => x => x.Slug;


		public ProviderRepository(DatabaseContext database) : base(database)
		{
			_database = database;
		}

		public override async Task<ICollection<ProviderID>> Search(string query)
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

			_database.Entry(obj).State = EntityState.Added;

			try
			{
				await _database.SaveChangesAsync();
			}
			catch (DbUpdateException ex)
			{
				_database.DiscardChanges();
				if (IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated provider (name {obj.Name} already exists).");
				throw;
			}
			
			return obj;
		}
		
		protected override Task Validate(ProviderID ressource)
		{
			return Task.CompletedTask;
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