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
	public class CollectionRepository : LocalRepository<Collection>, ICollectionRepository
	{
		private readonly DatabaseContext _database;
		private readonly Lazy<IShowRepository> _shows;
		protected override Expression<Func<Collection, object>> DefaultSort => x => x.Name;

		public CollectionRepository(DatabaseContext database, IServiceProvider services) : base(database)
		{
			_database = database;
			_shows = new Lazy<IShowRepository>(services.GetRequiredService<IShowRepository>);
		}

		public override void Dispose()
		{
			base.Dispose();
			if (_shows.IsValueCreated)
				_shows.Value.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			await _database.DisposeAsync();
			if (_shows.IsValueCreated)
				await _shows.Value.DisposeAsync();
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
					throw new DuplicatedItemException($"Trying to insert a duplicated collection (slug {obj.Slug} already exists).");
				throw;
			}

			return obj;
		}

		protected override Task Validate(Collection ressource)
		{
			return Task.CompletedTask;
		}

		public override async Task Delete(Collection obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Entry(obj).State = EntityState.Deleted;
			if (obj.Links != null)
				foreach (CollectionLink link in obj.Links)
					_database.Entry(link).State = EntityState.Deleted;
			if (obj.LibraryLinks != null)
				foreach (LibraryLink link in obj.LibraryLinks)
					_database.Entry(link).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}

		public async Task<ICollection<Collection>> GetFromShow(int showID, 
			Expression<Func<Collection, bool>> where = null,
			Sort<Collection> sort = default,
			Pagination limit = default)
		{
			ICollection<Collection> collections = await ApplyFilters(_database.CollectionLinks
					.Where(x => x.ShowID == showID)
					.Select(x => x.Collection),
				where,
				sort,
				limit);
			if (!collections.Any() & await _shows.Value.Get(showID) == null)
				throw new ItemNotFound();
			return collections;
		}

		public async Task<ICollection<Collection>> GetFromShow(string showSlug, 
			Expression<Func<Collection, bool>> where = null,
			Sort<Collection> sort = default,
			Pagination limit = default)
		{
			ICollection<Collection> collections = await ApplyFilters(_database.CollectionLinks
					.Where(x => x.Show.Slug == showSlug)
					.Select(x => x.Collection),
				where,
				sort,
				limit);
			if (!collections.Any() & await _shows.Value.Get(showSlug) == null)
				throw new ItemNotFound();
			return collections;
		}
	}
}