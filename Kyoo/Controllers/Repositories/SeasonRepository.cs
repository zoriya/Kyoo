using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class SeasonRepository : ISeasonRepository
	{
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;
		private readonly IEpisodeRepository _episodes;


		public SeasonRepository(DatabaseContext database, IProviderRepository providers, IEpisodeRepository episodes)
		{
			_database = database;
			_providers = providers;
			_episodes = episodes;
		}
		
		public void Dispose()
		{
			_database.Dispose();
		}

		public ValueTask DisposeAsync()
		{
			return _database.DisposeAsync();
		}
		
		public Task<Season> Get(int id)
		{
			return _database.Seasons.FirstOrDefaultAsync(x => x.ID == id);
		}

		public Task<Season> Get(string slug)
		{
			int index = slug.IndexOf("-s", StringComparison.Ordinal);
			if (index == -1)
				throw new InvalidOperationException("Invalid season slug. Format: {showSlug}-s{seasonNumber}");
			string showSlug = slug.Substring(0, index);
			if (!int.TryParse(slug.Substring(index + 2), out int seasonNumber))
				throw new InvalidOperationException("Invalid season slug. Format: {showSlug}-s{seasonNumber}");
			return Get(showSlug, seasonNumber);
		}
		
		public Task<Season> Get(string showSlug, int seasonNumber)
		{
			return _database.Seasons.FirstOrDefaultAsync(x => x.Show.Slug == showSlug 
			                                                        && x.SeasonNumber == seasonNumber);
		}

		public async Task<ICollection<Season>> Search(string query)
		{
			return await _database.Seasons
				.Where(x => EF.Functions.Like(x.Title, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public async Task<ICollection<Season>> GetAll()
		{
			return await _database.Seasons.ToListAsync();
		}

		public async Task<int> Create(Season obj)
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
				if (Helper.IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated season (slug {obj.Slug} already exists).");
				throw;
			}
			
			return obj.ID;
		}
		
		public async Task<int> CreateIfNotExists(Season obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			Season old = await Get(obj.Slug);
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

		public async Task Edit(Season edited, bool resetOld)
		{
			if (edited == null)
				throw new ArgumentNullException(nameof(edited));
			
			Season old = await Get(edited.Slug);

			if (old == null)
				throw new ItemNotFound($"No season found with the slug {edited.Slug}.");
			
			if (resetOld)
				Utility.Nullify(old);
			Utility.Merge(old, edited);

			await Validate(old);
			await _database.SaveChangesAsync();
		}

		private async Task Validate(Season obj)
		{
			if (obj.ShowID <= 0)
				throw new InvalidOperationException($"Can't store a season not related to any show (showID: {obj.ShowID}).");

			if (obj.ExternalIDs != null)
			{
				foreach (MetadataID link in obj.ExternalIDs)
					link.ProviderID = await _providers.CreateIfNotExists(link.Provider);
			}
		}
		
		public async Task Delete(int id)
		{
			Season obj = await Get(id);
			await Delete(obj);
		}

		public async Task Delete(string slug)
		{
			Season obj = await Get(slug);
			await Delete(obj);
		}

		public async Task Delete(string showSlug, int seasonNumber)
		{
			Season obj = await Get(showSlug, seasonNumber);
			await Delete(obj);
		}

		public async Task Delete(Season obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Deleted;
			if (obj.Episodes != null)
				foreach (Episode episode in obj.Episodes)
					await _episodes.Delete(episode);
			await _database.SaveChangesAsync();
		}
		
		public async Task<ICollection<Season>> GetSeasons(int showID)
		{
			return await _database.Seasons.Where(x => x.ShowID == showID).ToListAsync();
		}

		public async Task<ICollection<Season>> GetSeasons(string showSlug)
		{
			return await _database.Seasons.Where(x => x.Show.Slug == showSlug).ToListAsync();
		}
	}
}