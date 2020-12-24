using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class TrackRepository : LocalRepository<Track>, ITrackRepository
	{
		private bool _disposed;
		private readonly DatabaseContext _database;
		protected override Expression<Func<Track, object>> DefaultSort => x => x.ID;


		public TrackRepository(DatabaseContext database) : base(database)
		{
			_database = database;
		}

		public override void Dispose()
		{
			if (_disposed)
				return;
			_disposed = true;
			_database.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			if (_disposed)
				return;
			_disposed = true;
			await _database.DisposeAsync();
		}

		public Task<Track> Get(string slug, StreamType type = StreamType.Unknown)
		{
			Match match = Regex.Match(slug,
				@"(?<show>.*)-s(?<season>\d+)e(?<episode>\d+)\.(?<language>.{0,3})(?<forced>-forced)?(\..*)?");

			if (!match.Success)
			{
				if (int.TryParse(slug, out int id))
					return Get(id);
				match = Regex.Match(slug, @"(?<show>.*)\.(?<language>.{0,3})(?<forced>-forced)?(\..*)?");
				if (!match.Success)
					throw new ArgumentException("Invalid track slug. " +
					                            "Format: {episodeSlug}.{language}[-forced][.{extension}]");
			}

			string showSlug = match.Groups["show"].Value;
			int seasonNumber = match.Groups["season"].Success ? int.Parse(match.Groups["season"].Value) : -1;
			int episodeNumber = match.Groups["episode"].Success ? int.Parse(match.Groups["episode"].Value) : -1;
			string language = match.Groups["language"].Value;
			bool forced = match.Groups["forced"].Success;

			if (type == StreamType.Unknown)
			{
				return _database.Tracks.FirstOrDefaultAsync(x => x.Episode.Show.Slug == showSlug
			        	                                         && x.Episode.SeasonNumber == seasonNumber
			                	                                 && x.Episode.EpisodeNumber == episodeNumber
			                        	                         && x.Language == language
			                                	                 && x.IsForced == forced);
		 	}
			return _database.Tracks.FirstOrDefaultAsync(x => x.Episode.Show.Slug == showSlug
									 && x.Episode.SeasonNumber == seasonNumber
									 && x.Episode.EpisodeNumber == episodeNumber
									 && x.Type == type
									 && x.Language == language
									 && x.IsForced == forced);
		}

		public Task<ICollection<Track>> Search(string query)
		{
			throw new InvalidOperationException("Tracks do not support the search method.");
		}

		public override async Task<Track> Create(Track obj)
		{
			if (obj.EpisodeID <= 0)
				throw new InvalidOperationException($"Can't store a track not related to any episode (episodeID: {obj.EpisodeID}).");

			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync($"Trying to insert a duplicated track (slug {obj.Slug} already exists).");
			return obj;
		}
		
		protected override Task Validate(Track resource)
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
	}
}
