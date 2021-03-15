using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class EpisodeRepository : LocalRepository<Episode>, IEpisodeRepository
	{
		private bool _disposed;
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;
		private readonly IShowRepository _shows;
		private readonly ITrackRepository _tracks;
		protected override Expression<Func<Episode, object>> DefaultSort => x => x.EpisodeNumber;


		public EpisodeRepository(DatabaseContext database, 
			IProviderRepository providers,
			IShowRepository shows,
			ITrackRepository tracks) 
			: base(database)
		{
			_database = database;
			_providers = providers;
			_shows = shows;
			_tracks = tracks;
		}


		public override void Dispose()
		{
			if (_disposed)
				return;
			_disposed = true;
			_database.Dispose();
			_providers.Dispose();
			_shows.Dispose();
			GC.SuppressFinalize(this);
		}

		public override async ValueTask DisposeAsync()
		{
			if (_disposed)
				return;
			_disposed = true;
			await _database.DisposeAsync();
			await _providers.DisposeAsync();
			await _shows.DisposeAsync();
		}

		public override async Task<Episode> Get(int id)
		{
			Episode ret = await base.Get(id);
			if (ret != null)
				ret.ShowSlug = await _shows.GetSlug(ret.ShowID);
			return ret;
		}

		public override Task<Episode> Get(string slug)
		{
			Match match = Regex.Match(slug, @"(?<show>.*)-s(?<season>\d*)e(?<episode>\d*)");
			
			if (!match.Success)
				return _database.Episodes.FirstOrDefaultAsync(x => x.Show.Slug == slug);
			return Get(match.Groups["show"].Value,
				int.Parse(match.Groups["season"].Value), 
				int.Parse(match.Groups["episode"].Value));
		}

		public override async Task<Episode> Get(Expression<Func<Episode, bool>> predicate)
		{
			Episode ret = await base.Get(predicate);
			if (ret != null)
				ret.ShowSlug = await _shows.GetSlug(ret.ShowID);
			return ret;
		}

		public async Task<Episode> Get(string showSlug, int seasonNumber, int episodeNumber)
		{
			Episode ret = await _database.Episodes.FirstOrDefaultAsync(x => x.Show.Slug == showSlug 
			                                                                && x.SeasonNumber == seasonNumber 
			                                                                && x.EpisodeNumber == episodeNumber);
			if (ret != null)
				ret.ShowSlug = showSlug;
			return ret;
		}

		public async Task<Episode> Get(int showID, int seasonNumber, int episodeNumber)
		{
			Episode ret = await _database.Episodes.FirstOrDefaultAsync(x => x.ShowID == showID 
			                                                                && x.SeasonNumber == seasonNumber 
			                                                                && x.EpisodeNumber == episodeNumber);
			if (ret != null)
				ret.ShowSlug = await _shows.GetSlug(showID);
			return ret;
		}

		public async Task<Episode> Get(int seasonID, int episodeNumber)
		{
			Episode ret = await _database.Episodes.FirstOrDefaultAsync(x => x.SeasonID == seasonID 
			                                                                && x.EpisodeNumber == episodeNumber);
			if (ret != null)
				ret.ShowSlug = await _shows.GetSlug(ret.ShowID);
			return ret;
		}

		public async Task<Episode> GetAbsolute(int showID, int absoluteNumber)
		{
			Episode ret = await _database.Episodes.FirstOrDefaultAsync(x => x.ShowID == showID 
			                                                                && x.AbsoluteNumber == absoluteNumber);
			if (ret != null)
				ret.ShowSlug = await _shows.GetSlug(showID);
			return ret;
		}

		public async Task<Episode> GetAbsolute(string showSlug, int absoluteNumber)
		{
			Episode ret = await _database.Episodes.FirstOrDefaultAsync(x => x.Show.Slug == showSlug 
			                                                                && x.AbsoluteNumber == absoluteNumber);
			if (ret != null)
				ret.ShowSlug = showSlug;
			return ret;
		}

		public override async Task<ICollection<Episode>> Search(string query)
		{
			List<Episode> episodes = await _database.Episodes
				.Where(x => EF.Functions.ILike(x.Title, $"%{query}%") && x.EpisodeNumber != -1)
				.OrderBy(DefaultSort)
				.Take(20)
				.ToListAsync();
			foreach (Episode episode in episodes)
				episode.ShowSlug = await _shows.GetSlug(episode.ShowID);
			return episodes;
		}
		
		public override async Task<ICollection<Episode>> GetAll(Expression<Func<Episode, bool>> where = null, 
			Sort<Episode> sort = default, 
			Pagination limit = default)
		{
			ICollection<Episode> episodes = await base.GetAll(where, sort, limit);
			foreach (Episode episode in episodes)
				episode.ShowSlug = await _shows.GetSlug(episode.ShowID);
			return episodes;
		}

		public override async Task<Episode> Create(Episode obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			obj.ExternalIDs.ForEach(x => _database.Entry(x).State = EntityState.Added);
			obj.Tracks.ForEach(x => _database.Entry(x).State = EntityState.Added);
			await _database.SaveChangesAsync($"Trying to insert a duplicated episode (slug {obj.Slug} already exists).");
			return obj;
		}

		protected override async Task Validate(Episode resource)
		{
			if (resource.ShowID <= 0)
				throw new InvalidOperationException($"Can't store an episode not related to any show (showID: {resource.ShowID}).");

			await base.Validate(resource);

			if (resource.Tracks != null)
			{
				// TODO remove old values
				resource.Tracks = await resource.Tracks
					.SelectAsync(x => _tracks.CreateIfNotExists(x, true))
					.ToListAsync();
			}

			if (resource.ExternalIDs != null)
			{
				foreach (MetadataID link in resource.ExternalIDs)
					if (ShouldValidate(link))
						link.Provider = await _providers.CreateIfNotExists(link.Provider, true);
			}
		}

		public async Task Delete(string showSlug, int seasonNumber, int episodeNumber)
		{
			Episode obj = await Get(showSlug, seasonNumber, episodeNumber);
			await Delete(obj);
		}

		public override async Task Delete(Episode obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			await obj.Tracks.ForEachAsync(x => _tracks.CreateIfNotExists(x, true));
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}
	}
}