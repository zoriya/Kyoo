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
	public class PeopleRepository : LocalRepository<People>, IPeopleRepository
	{
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;
		protected override Expression<Func<People, object>> DefaultSort => x => x.Name;

		public PeopleRepository(DatabaseContext database, IProviderRepository providers) : base(database)
		{
			_database = database;
			_providers = providers;
		}


		public override void Dispose()
		{
			_database.Dispose();
			_providers.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			await _database.DisposeAsync();
			await _providers.DisposeAsync();
		}

		public override async Task<ICollection<People>> Search(string query)
		{
			return await _database.Peoples
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
			
			try
			{
				await _database.SaveChangesAsync();
			}
			catch (DbUpdateException ex)
			{
				_database.DiscardChanges();
				if (IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated people (slug {obj.Slug} already exists).");
				throw;
			}
			
			return obj;
		}

		protected override async Task Validate(People obj)
		{
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
				foreach (PeopleLink link in obj.Roles)
					_database.Entry(link).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}
	}
}