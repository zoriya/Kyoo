using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class EpisodeRepository : IEpisodeRepository
	{
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;


		public EpisodeRepository(DatabaseContext database, IProviderRepository providers)
		{
			_database = database;
			_providers = providers;
		}
		
		public async Task<Episode> Get(long id)
		{
			return await _database.Episodes.FirstOrDefaultAsync(x => x.ID == id);
		}

		public Task<Episode> Get(string slug)
		{
			int sIndex = slug.IndexOf("-s", StringComparison.Ordinal);
			int eIndex = slug.IndexOf("-e", StringComparison.Ordinal);
			if (sIndex == -1 || eIndex == -1 || eIndex < sIndex)
				throw new InvalidOperationException("Invalid episode slug. Format: {showSlug}-s{seasonNumber}-e{episodeNumber}");
			string showSlug = slug.Substring(0, sIndex);
			if (!long.TryParse(slug.Substring(sIndex + 2), out long seasonNumber))
				throw new InvalidOperationException("Invalid episode slug. Format: {showSlug}-s{seasonNumber}-e{episodeNumber}");
			if (!long.TryParse(slug.Substring(eIndex + 2), out long episodeNumber))
				throw new InvalidOperationException("Invalid episode slug. Format: {showSlug}-s{seasonNumber}-e{episodeNumber}");
			return Get(showSlug, seasonNumber, episodeNumber);
		}
		
		public async Task<Episode> Get(string showSlug, long seasonNumber, long episodeNumber)
		{
			return await _database.Episodes.FirstOrDefaultAsync(x => x.Show.Slug == showSlug 
			                                                         && x.SeasonNumber == seasonNumber
			                                                         && x.EpisodeNumber == episodeNumber);
		}

		public async Task<IEnumerable<Episode>> Search(string query)
		{
			return await _database.Episodes
				.Where(x => EF.Functions.Like(x.Title, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public async Task<IEnumerable<Episode>> GetAll()
		{
			return await _database.Episodes.ToListAsync();
		}

		public async Task<long> Create(Episode obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			// TODO initialize ShowID & SeaosnID here. (same for the season repository). OR null check the ID and throw on invalid.
			obj.Show = null;
			obj.Season = null;
			await Validate(obj);

			await _database.Episodes.AddAsync(obj);
			await _database.SaveChangesAsync();
			return obj.ID;
		}
		
		public async Task<long> CreateIfNotExists(Episode obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			Episode old = await Get(obj.Slug);
			if (old != null)
				return old.ID;
			return await Create(obj);
		}

		public async Task Edit(Episode edited, bool resetOld)
		{
			if (edited == null)
				throw new ArgumentNullException(nameof(edited));
			
			Episode old = await Get(edited.Slug);

			if (old == null)
				throw new ItemNotFound($"No episode found with the slug {edited.Slug}.");
			
			if (resetOld)
				Utility.Nullify(old);
			Utility.Merge(old, edited);

			await Validate(old);
			await _database.SaveChangesAsync();
		}

		private async Task Validate(Episode obj)
		{
			obj.ExternalIDs = (await Task.WhenAll(obj.ExternalIDs.Select(async x =>
			{
				x.ProviderID = await _providers.CreateIfNotExists(x.Provider);
				return x;
			}))).ToList();
		}
		
		public async Task Delete(Episode obj)
		{
			_database.Episodes.Remove(obj);
			await _database.SaveChangesAsync();
		}
	}
}