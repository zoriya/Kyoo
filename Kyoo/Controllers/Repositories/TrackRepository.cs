using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	/// <summary>
	/// A local repository to handle tracks.
	/// </summary>
	public class TrackRepository : LocalRepository<Track>, ITrackRepository
	{
		/// <summary>
		/// The databse handle
		/// </summary>
		private readonly DatabaseContext _database;
		
		/// <inheritdoc />
		protected override Expression<Func<Track, object>> DefaultSort => x => x.TrackIndex;


		/// <summary>
		/// Create a new <see cref="TrackRepository"/>.
		/// </summary>
		/// <param name="database">The datatabse handle</param>
		public TrackRepository(DatabaseContext database) 
			: base(database)
		{
			_database = database;
		}
		

		/// <inheritdoc />
		public override Task<Track> Get(string slug)
		{
			return Get(slug, StreamType.Unknown);
		}

		/// <inheritdoc />
		public async Task<Track> Get(string slug, StreamType type)
		{
			Track ret = await GetOrDefault(slug, type);
			if (ret == null)
				throw new ItemNotFound($"No track found with the slug {slug} and the type {type}.");
			return ret;
		}
		
		/// <inheritdoc />
		public Task<Track> GetOrDefault(string slug, StreamType type)
		{
			Match match = Regex.Match(slug,
				@"(?<show>.*)-s(?<season>\d+)e(?<episode>\d+)(\.(?<type>\w*))?\.(?<language>.{0,3})(?<forced>-forced)?(\..*)?");

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
			if (match.Groups["type"].Success)
				type = Enum.Parse<StreamType>(match.Groups["type"].Value, true);

			IQueryable<Track> query = _database.Tracks.Where(x => x.Episode.Show.Slug == showSlug
			                                                      && x.Episode.SeasonNumber == seasonNumber
			                                                      && x.Episode.EpisodeNumber == episodeNumber
			                                                      && x.Language == language
			                                                      && x.IsForced == forced);
			if (type != StreamType.Unknown)
				return query.FirstOrDefaultAsync(x => x.Type == type);
			return query.FirstOrDefaultAsync();
		}

		/// <inheritdoc />
		public override Task<ICollection<Track>> Search(string query)
		{
			throw new InvalidOperationException("Tracks do not support the search method.");
		}

		/// <inheritdoc />
		public override async Task<Track> Create(Track obj)
		{
			if (obj.EpisodeID <= 0)
			{
				obj.EpisodeID = obj.Episode?.ID ?? 0;
				if (obj.EpisodeID <= 0)
					throw new InvalidOperationException($"Can't store a track not related to any episode (episodeID: {obj.EpisodeID}).");
			}

			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveOrRetry(obj, (x, i) =>
			{
				if (i > 10)
					throw new DuplicatedItemException($"More than 10 same tracks exists {x.Slug}. Aborting...");
				x.TrackIndex++;
				return x;
			});
			return obj;
		}

		/// <inheritdoc />
		public override async Task Delete(Track obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}
	}
}
