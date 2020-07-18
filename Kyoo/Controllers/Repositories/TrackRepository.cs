using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class TrackRepository : LocalRepository<Track>, ITrackRepository
	{
		private readonly DatabaseContext _database;
		protected override Expression<Func<Track, object>> DefaultSort => x => x.ID;


		public TrackRepository(DatabaseContext database) : base(database)
		{
			_database = database;
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

		public Task<Track> Get(int episodeID, string languageTag, bool isForced)
		{
			return _database.Tracks.FirstOrDefaultAsync(x => x.EpisodeID == episodeID
			                                                       && x.Language == languageTag
			                                                       && x.IsForced == isForced);
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
			
			try
			{
				await _database.SaveChangesAsync();
			}
			catch (DbUpdateException ex)
			{
				_database.DiscardChanges();
				if (IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated track (slug {obj.Slug} already exists).");
				throw;
			}
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
	}
}