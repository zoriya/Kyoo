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
	public class LibraryRepository : LocalRepository<Library>, ILibraryRepository
	{
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;
		protected override Expression<Func<Library, object>> DefaultSort => x => x.ID;


		public LibraryRepository(DatabaseContext database, IProviderRepository providers) : base(database)
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

		public override async Task<ICollection<Library>> Search(string query)
		{
			return await _database.Libraries
				.Where(x => EF.Functions.ILike(x.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public override async Task<Library> Create(Library obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			await Validate(obj);
			_database.Entry(obj).State = EntityState.Added;
			if (obj.ProviderLinks != null)
				foreach (ProviderLink entry in obj.ProviderLinks)
					_database.Entry(entry).State = EntityState.Added;
			
			try
			{
				await _database.SaveChangesAsync();
			}
			catch (DbUpdateException ex)
			{
				_database.DiscardChanges();
				if (IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated library (slug {obj.Slug} already exists).");
				throw;
			}
			
			return obj;
		}

		protected override async Task Validate(Library obj)
		{
			if (obj.ProviderLinks != null)
				foreach (ProviderLink link in obj.ProviderLinks)
					link.Provider = await _providers.CreateIfNotExists(link.Provider);
		}

		public override async Task Delete(Library obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			if (obj.ProviderLinks != null)
				foreach (ProviderLink entry in obj.ProviderLinks)
					_database.Entry(entry).State = EntityState.Deleted;
			if (obj.Links != null)
				foreach (LibraryLink entry in obj.Links)
					_database.Entry(entry).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}
	}
}