using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Controllers
{
	public class LibraryRepository : LocalRepository<Library, LibraryDE>, ILibraryRepository
	{
		private bool _disposed;
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;
		protected override Expression<Func<LibraryDE, object>> DefaultSort => x => x.ID;


		public LibraryRepository(DatabaseContext database, IProviderRepository providers)
			: base(database)
		{
			_database = database;
			_providers = providers;
		}
		
		public override void Dispose()
		{
			if (_disposed)
				return;
			_disposed = true;
			_database.Dispose();
			_providers.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			if (_disposed)
				return;
			_disposed = true;
			await _database.DisposeAsync();
			await _providers.DisposeAsync();
		}

		public override async Task<ICollection<Library>> Search(string query)
		{
			return await _database.Libraries
				.Where(x => EF.Functions.ILike(x.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync<Library>();
		}

		public override async Task<LibraryDE> Create(LibraryDE obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			if (obj.ProviderLinks != null)
				foreach (ProviderLink entry in obj.ProviderLinks)
					_database.Entry(entry).State = EntityState.Added;
			
			await _database.SaveChangesAsync($"Trying to insert a duplicated library (slug {obj.Slug} already exists).");
			return obj;
		}

		protected override async Task Validate(LibraryDE resource)
		{
			if (string.IsNullOrEmpty(resource.Slug))
				throw new ArgumentException("The library's slug must be set and not empty");
			if (string.IsNullOrEmpty(resource.Name))
				throw new ArgumentException("The library's name must be set and not empty");
			if (resource.Paths == null || !resource.Paths.Any())
				throw new ArgumentException("The library should have a least one path.");
			
			await base.Validate(resource);
			
			if (resource.ProviderLinks != null)
				foreach (ProviderLink link in resource.ProviderLinks)
					link.Provider = await _providers.CreateIfNotExists(link.Provider, true);
		}

		public override async Task Delete(LibraryDE obj)
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