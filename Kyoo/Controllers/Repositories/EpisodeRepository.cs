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
			await _database.SaveChangesAsync($"Trying to insert a duplicated episode (slug {obj.Slug} already exists).");
			obj.Tracks = await obj.Tracks.SelectAsync(x =>
			{
				x.Episode = obj;
				x.EpisodeID = obj.ID;
				return _tracks.CreateIfNotExists(x, true);
			}).ToListAsync();
			return obj;
		}

		protected override async Task EditRelations(Episode resource, Episode changed, bool resetOld)
		{
			if (resource.ShowID <= 0)
				throw new InvalidOperationException($"Can't store an episode not related to any show (showID: {resource.ShowID}).");
			
			if (changed.Tracks != null || resetOld)
			{
				ICollection<Track> oldTracks = await _tracks.GetAll(x => x.EpisodeID == resource.ID);
				resource.Tracks = await changed.Tracks.SelectAsync(async track =>
					{
						Track oldValue = oldTracks?.FirstOrDefault(x => Utility.ResourceEquals(track, x));
						if (oldValue == null)
							return await _tracks.CreateIfNotExists(track, true);
						oldTracks.Remove(oldValue);
						return oldValue;
					})
					.ToListAsync();
				foreach (Track x in oldTracks)
					await _tracks.Delete(x);
			}

			if (changed.ExternalIDs != null || resetOld)
			{
				await Database.Entry(resource).Collection(x => x.ExternalIDs).LoadAsync();
				resource.ExternalIDs = changed.ExternalIDs?.Select(x => 
				{ 
					x.Provider = null;
					return x;
				}).ToList();
			}
		}

		protected override async Task Validate(Episode resource)
		{
			await base.Validate(resource);
			await resource.ExternalIDs.ForEachAsync(async id => 
				id.Provider = await _providers.CreateIfNotExists(id.Provider, true));
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
			await obj.Tracks.ForEachAsync(x => _tracks.Delete(x));
			obj.ExternalIDs.ForEach(x => _database.Entry(x).State = EntityState.Deleted);
			await _database.SaveChangesAsync();
		}
	}
}