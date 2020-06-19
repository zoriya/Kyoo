using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class LibraryRepository : ILibraryRepository
	{
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;


		public LibraryRepository(DatabaseContext database, IProviderRepository providers)
		{
			_database = database;
			_providers = providers;
		}

		public void Dispose()
		{
			_database.Dispose();
		}

		public ValueTask DisposeAsync()
		{
			return _database.DisposeAsync();
		}

		public Task<Library> Get(int id)
		{
			return _database.Libraries.FirstOrDefaultAsync(x => x.ID == id);
		}
		
		public Task<Library> Get(string slug)
		{
			return _database.Libraries.FirstOrDefaultAsync(x => x.Slug == slug);
		}

		public async Task<ICollection<Library>> Search(string query)
		{
			return await _database.Libraries
				.Where(x => EF.Functions.Like(x.Name, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public async Task<ICollection<Library>> GetAll()
		{
			return await _database.Libraries.ToListAsync();
		}

		public async Task<int> Create(Library obj)
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
				if (Helper.IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated library (slug {obj.Slug} already exists).");
				throw;
			}
			
			return obj.ID;
		}
		
		public async Task<int> CreateIfNotExists(Library obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			Library old = await Get(obj.Slug);
			if (old != null)
				return old.ID;
			try
			{
				return await Create(obj);
			}
			catch (DuplicatedItemException)
			{
				old = await Get(obj.Slug);
				if (old == null)
					throw new SystemException("Unknown database state.");
				return old.ID;
			}
		}

		public async Task Edit(Library edited, bool resetOld)
		{
			if (edited == null)
				throw new ArgumentNullException(nameof(edited));
			
			Library old = await Get(edited.Name);

			if (old == null)
				throw new ItemNotFound($"No library found with the name {edited.Name}.");
			
			if (resetOld)
				Utility.Nullify(old);
			Utility.Merge(old, edited);
			await Validate(old);
			await _database.SaveChangesAsync();
		}

		private async Task Validate(Library obj)
		{
			if (obj.ProviderLinks != null)
				foreach (ProviderLink link in obj.ProviderLinks)
					link.ProviderID = await _providers.CreateIfNotExists(link.Provider);
		}

		public async Task Delete(Library obj)
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