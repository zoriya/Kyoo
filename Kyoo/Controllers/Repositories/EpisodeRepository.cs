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
	public class EpisodeRepository : IEpisodeRepository
	{
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;
		// private readonly ITrackRepository _tracks;


		public EpisodeRepository(DatabaseContext database, IProviderRepository providers)
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
		
		public Task<Episode> Get(int id)
		{
			return _database.Episodes.FirstOrDefaultAsync(x => x.ID == id);
		}

		public Task<Episode> Get(string slug)
		{
			int sIndex = slug.IndexOf("-s", StringComparison.Ordinal);
			int eIndex = slug.IndexOf("-e", StringComparison.Ordinal);

			if (sIndex == -1 && eIndex == -1)
				return _database.Episodes.FirstOrDefaultAsync(x => x.Show.Slug == slug);
			
			if (sIndex == -1 || eIndex == -1 || eIndex < sIndex)
				throw new InvalidOperationException("Invalid episode slug. Format: {showSlug}-s{seasonNumber}-e{episodeNumber}");
			string showSlug = slug.Substring(0, sIndex);
			if (!int.TryParse(slug.Substring(sIndex + 2), out int seasonNumber))
				throw new InvalidOperationException("Invalid episode slug. Format: {showSlug}-s{seasonNumber}-e{episodeNumber}");
			if (!int.TryParse(slug.Substring(eIndex + 2), out int episodeNumber))
				throw new InvalidOperationException("Invalid episode slug. Format: {showSlug}-s{seasonNumber}-e{episodeNumber}");
			return Get(showSlug, seasonNumber, episodeNumber);
		}
		
		public Task<Episode> Get(string showSlug, int seasonNumber, int episodeNumber)
		{
			return _database.Episodes.FirstOrDefaultAsync(x => x.Show.Slug == showSlug 
			                                                         && x.SeasonNumber == seasonNumber
			                                                         && x.EpisodeNumber == episodeNumber);
		}
		
		public async Task<ICollection<Episode>> Search(string query)
		{
			return await _database.Episodes
				.Where(x => EF.Functions.Like(x.Title, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public async Task<ICollection<Episode>> GetAll(Expression<Func<Episode, bool>> where = null, 
			Sort<Episode> sort = default,
			Pagination page = default)
		{
			return await _database.Episodes.ToListAsync();
		}

		public async Task<int> Create(Episode obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			await Validate(obj);
			_database.Entry(obj).State = EntityState.Added;
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Added;
			
			// Since Episodes & Tracks are on the same DB, using a single commit is quicker.
			if (obj.Tracks != null)
				foreach (Track entry in obj.Tracks)
					_database.Entry(entry).State = EntityState.Added;

			try
			{
				await _database.SaveChangesAsync();
			}
			catch (DbUpdateException ex)
			{
				_database.DiscardChanges();
				
				if (Helper.IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated episode (slug {obj.Slug} already exists).");
				throw;
			}
			
			// Since Episodes & Tracks are on the same DB, using a single commit is quicker.
			/*if (obj.Tracks != null)
			 *	foreach (Track track in obj.Tracks)
			 *	{
			 * 		track.EpisodeID = obj.ID;
			 *		await _tracks.Create(track);
			 *	}
			 */
			
			return obj.ID;
		}
		
		public async Task<int> CreateIfNotExists(Episode obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			Episode old = await Get(obj.Slug);
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
			if (obj.ShowID <= 0)
				throw new InvalidOperationException($"Can't store an episode not related to any show (showID: {obj.ShowID}).");

			if (obj.ExternalIDs != null)
			{
				foreach (MetadataID link in obj.ExternalIDs)
					link.ProviderID = await _providers.CreateIfNotExists(link.Provider);
			}
		}
		
		public async Task<ICollection<Episode>> GetEpisodes(int showID, int seasonNumber)
		{
			return await _database.Episodes.Where(x => x.ShowID == showID
			                                           && x.SeasonNumber == seasonNumber).ToListAsync();
		}

		public async Task<ICollection<Episode>> GetEpisodes(string showSlug, int seasonNumber)
		{
			return await _database.Episodes.Where(x => x.Show.Slug == showSlug
			                                           && x.SeasonNumber == seasonNumber).ToListAsync();
		}

		public async Task<ICollection<Episode>> GetEpisodes(int seasonID)
		{
			return await _database.Episodes.Where(x => x.SeasonID == seasonID).ToListAsync();
		}
		
		public async Task Delete(int id)
		{
			Episode obj = await Get(id);
			await Delete(obj);
		}

		public async Task Delete(string slug)
		{
			Episode obj = await Get(slug);
			await Delete(obj);
		}

		public async Task Delete(string showSlug, int seasonNumber, int episodeNumber)
		{
			Episode obj = await Get(showSlug, seasonNumber, episodeNumber);
			await Delete(obj);
		}

		public async Task Delete(Episode obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Deleted;
			// Since Tracks & Episodes are on the same database and handled by dotnet-ef, we can't use the repository to delete them. 
			await _database.SaveChangesAsync();
		}

		public async Task DeleteRange(IEnumerable<Episode> objs)
		{
			foreach (Episode obj in objs)
				await Delete(obj);
		}
		
		public async Task DeleteRange(IEnumerable<int> ids)
		{
			foreach (int id in ids)
				await Delete(id);
		}
		
		public async Task DeleteRange(IEnumerable<string> slugs)
		{
			foreach (string slug in slugs)
				await Delete(slug);
		}
	}
}