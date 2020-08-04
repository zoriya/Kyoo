using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Controllers
{
	public class TrackRepository : LocalRepository<Track>, ITrackRepository
	{
		private readonly DatabaseContext _database;
		private readonly Lazy<IEpisodeRepository> _episodes;
		protected override Expression<Func<Track, object>> DefaultSort => x => x.ID;


		public TrackRepository(DatabaseContext database, IServiceProvider services) : base(database)
		{
			_database = database;
			_episodes = new Lazy<IEpisodeRepository>(services.GetRequiredService<IEpisodeRepository>);
		}

		public override void Dispose()
		{
			_database.Dispose();
			if (_episodes.IsValueCreated)
				_episodes.Value.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			await _database.DisposeAsync();
			if (_episodes.IsValueCreated)
				await _episodes.Value.DisposeAsync();
		}

		public override Task<Track> Get(string slug)
		{
			Match match = Regex.Match(slug,
				@"(?<show>.*)-s(?<season>\d*)-e(?<episode>\d*).(?<language>.{0,3})(?<forced>-forced)?(\..*)?");

			if (!match.Success)
			{
				if (int.TryParse(slug, out int id))
					return Get(id);
				throw new ArgumentException("Invalid track slug. Format: {episodeSlug}.{language}[-forced][.{extension}]");
			}

			string showSlug = match.Groups["show"].Value;
			int seasonNumber = int.Parse(match.Groups["season"].Value);
			int episodeNumber = int.Parse(match.Groups["episode"].Value);
			string language = match.Groups["language"].Value;
			bool forced = match.Groups["forced"].Success;
			return _database.Tracks.FirstOrDefaultAsync(x => x.Episode.Show.Slug == showSlug
			                                                 && x.Episode.SeasonNumber == seasonNumber
			                                                 && x.Episode.EpisodeNumber == episodeNumber
			                                                 && x.Language == language
			                                                 && x.IsForced == forced);
		}
		public override Task<ICollection<Track>> Search(string query)
		{
			throw new InvalidOperationException("Tracks do not support the search method.");
		}

		public override async Task<Track> Create(Track obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			if (obj.EpisodeID <= 0)
				throw new InvalidOperationException($"Can't store a track not related to any episode (episodeID: {obj.EpisodeID}).");

			_database.Entry(obj).State = EntityState.Added;
			
			await _database.SaveChangesAsync($"Trying to insert a duplicated track (slug {obj.Slug} already exists).");
			return obj;
		}
		
		protected override Task Validate(Track ressource)
		{
			return Task.CompletedTask;
		}
		
		public override async Task Delete(Track obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}

		public async Task<ICollection<Track>> GetFromEpisode(int episodeID, 
			Expression<Func<Track, bool>> where = null, 
			Sort<Track> sort = default,
			Pagination limit = default)
		{
			ICollection<Track> tracks = await ApplyFilters(_database.Tracks.Where(x => x.EpisodeID == episodeID),
				where,
				sort,
				limit);
			if (!tracks.Any() && await _episodes.Value.Get(episodeID) == null)
				throw new ItemNotFound();
			return tracks;
		}

		public async Task<ICollection<Track>> GetFromEpisode(int showID, 
			int seasonNumber, 
			int episodeNumber,
			Expression<Func<Track, bool>> where = null,
			Sort<Track> sort = default,
			Pagination limit = default)
		{
			ICollection<Track> tracks = await ApplyFilters(_database.Tracks.Where(x => x.Episode.ShowID == showID 
			                                                                           && x.Episode.SeasonNumber == seasonNumber
			                                                                           && x.Episode.EpisodeNumber == episodeNumber),
				where,
				sort,
				limit);
			if (!tracks.Any() && await _episodes.Value.Get(showID, seasonNumber, episodeNumber) == null)
				throw new ItemNotFound();
			return tracks;
		}

		public async Task<ICollection<Track>> GetFromEpisode(string showSlug,
			int seasonNumber, 
			int episodeNumber, 
			Expression<Func<Track, bool>> where = null, 
			Sort<Track> sort = default,
			Pagination limit = default)
		{
			ICollection<Track> tracks = await ApplyFilters(_database.Tracks.Where(x => x.Episode.Show.Slug == showSlug 
			                                                                           && x.Episode.SeasonNumber == seasonNumber
			                                                                           && x.Episode.EpisodeNumber == episodeNumber),
				where,
				sort,
				limit);
			if (!tracks.Any() && await _episodes.Value.Get(showSlug, seasonNumber, episodeNumber) == null)
				throw new ItemNotFound();
			return tracks;
		}
	}
}