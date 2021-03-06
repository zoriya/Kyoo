using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class LibraryRepository : LocalRepository<Library>, ILibraryRepository
	{
		private bool _disposed;
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;
		protected override Expression<Func<Library, object>> DefaultSort => x => x.ID;


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
			GC.SuppressFinalize(this);
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
				.ToListAsync();
		}

		public override async Task<Library> Create(Library obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			obj.ProviderLinks = obj.Providers?.Select(x => Link.Create(obj, x)).ToArray();
			obj.ProviderLinks.ForEach(x => _database.Entry(x).State = EntityState.Added);
			await _database.SaveChangesAsync($"Trying to insert a duplicated library (slug {obj.Slug} already exists).");
			return obj;
		}

		protected override async Task Validate(Library resource)
		{
			if (string.IsNullOrEmpty(resource.Slug))
				throw new ArgumentException("The library's slug must be set and not empty");
			if (string.IsNullOrEmpty(resource.Name))
				throw new ArgumentException("The library's name must be set and not empty");
			if (resource.Paths == null || !resource.Paths.Any())
				throw new ArgumentException("The library should have a least one path.");
			
			await base.Validate(resource);

			if (resource.Providers != null)
			{
				resource.Providers = await resource.Providers
					.SelectAsync(x => _providers.CreateIfNotExists(x, true))
					.ToListAsync();
			}
		}

		public override async Task Delete(Library obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}
	}
}