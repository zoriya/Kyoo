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
	/// <summary>
	/// A local repository to handle episodes.
	/// </summary>
	public class EpisodeRepository : LocalRepository<Episode>, IEpisodeRepository
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;
		/// <summary>
		/// A provider repository to handle externalID creation and deletion
		/// </summary>
		private readonly IProviderRepository _providers;
		/// <summary>
		/// A track repository to handle creation and deletion of tracks related to the current episode.
		/// </summary>
		private readonly ITrackRepository _tracks;
		
		/// <inheritdoc />
		protected override Expression<Func<Episode, object>> DefaultSort => x => x.EpisodeNumber;


		/// <summary>
		/// Create a new <see cref="EpisodeRepository"/>.
		/// </summary>
		/// <param name="database">The database handle to use.</param>
		/// <param name="providers">A provider repository</param>
		/// <param name="tracks">A track repository</param>
		public EpisodeRepository(DatabaseContext database,
			IProviderRepository providers,
			ITrackRepository tracks) 
			: base(database)
		{
			_database = database;
			_providers = providers;
			_tracks = tracks;
		}
		
		/// <inheritdoc />
		public Task<Episode> GetOrDefault(int showID, int seasonNumber, int episodeNumber)
		{
			return _database.Episodes.FirstOrDefaultAsync(x => x.ShowID == showID 
			                                                   && x.SeasonNumber == seasonNumber 
			                                                   && x.EpisodeNumber == episodeNumber);
		}

		/// <inheritdoc />
		public Task<Episode> GetOrDefault(string showSlug, int seasonNumber, int episodeNumber)
		{
			return _database.Episodes.FirstOrDefaultAsync(x => x.Show.Slug == showSlug 
			                                                   && x.SeasonNumber == seasonNumber 
			                                                   && x.EpisodeNumber == episodeNumber);
		}

		/// <inheritdoc />
		public async Task<Episode> Get(int showID, int seasonNumber, int episodeNumber)
		{
			Episode ret = await GetOrDefault(showID, seasonNumber, episodeNumber);
			if (ret == null)
				throw new ItemNotFoundException($"No episode S{seasonNumber}E{episodeNumber} found on the show {showID}.");
			return ret;
		}

		/// <inheritdoc />
		public async Task<Episode> Get(string showSlug, int seasonNumber, int episodeNumber)
		{
			Episode ret = await GetOrDefault(showSlug, seasonNumber, episodeNumber);
			if (ret == null)
				throw new ItemNotFoundException($"No episode S{seasonNumber}E{episodeNumber} found on the show {showSlug}.");
			return ret;
		}

		/// <inheritdoc />
		public Task<Episode> GetAbsolute(int showID, int absoluteNumber)
		{
			return _database.Episodes.FirstOrDefaultAsync(x => x.ShowID == showID 
			                                                   && x.AbsoluteNumber == absoluteNumber);
		}

		/// <inheritdoc />
		public Task<Episode> GetAbsolute(string showSlug, int absoluteNumber)
		{
			return _database.Episodes.FirstOrDefaultAsync(x => x.Show.Slug == showSlug 
			                                                   && x.AbsoluteNumber == absoluteNumber);
		}

		/// <inheritdoc />
		public override async Task<ICollection<Episode>> Search(string query)
		{
			return await _database.Episodes
				.Where(x => x.EpisodeNumber != null)
				.Where(_database.Like<Episode>(x => x.Title, $"%{query}%"))
				.OrderBy(DefaultSort)
				.Take(20)
				.ToListAsync();
		}
		
		/// <inheritdoc />
		public override async Task<Episode> Create(Episode obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			obj.ExternalIDs.ForEach(x => _database.Entry(x).State = EntityState.Added);
			await _database.SaveChangesAsync($"Trying to insert a duplicated episode (slug {obj.Slug} already exists).");
			return await ValidateTracks(obj);
		}

		/// <inheritdoc />
		protected override async Task EditRelations(Episode resource, Episode changed, bool resetOld)
		{
			if (resource.ShowID <= 0)
				throw new InvalidOperationException($"Can't store an episode not related to any show (showID: {resource.ShowID}).");
			
			if (changed.Tracks != null || resetOld)
			{
				await _tracks.DeleteAll(x => x.EpisodeID == resource.ID);
				resource.Tracks = changed.Tracks;
				await ValidateTracks(resource);
			}

			if (changed.ExternalIDs != null || resetOld)
			{
				await Database.Entry(resource).Collection(x => x.ExternalIDs).LoadAsync();
				resource.ExternalIDs = changed.ExternalIDs;
			}

			await Validate(resource);
		}

		/// <summary>
		/// Set track's index and ensure that every tracks is well-formed.
		/// </summary>
		/// <param name="resource">The resource to fix.</param>
		/// <returns>The <see cref="resource"/> parameter is returned.</returns>
		private async Task<Episode> ValidateTracks(Episode resource)
		{
			resource.Tracks = await TaskUtils.DefaultIfNull(resource.Tracks?.MapAsync((x, i) =>
			{
				x.Episode = resource;
				x.TrackIndex = resource.Tracks.Take(i).Count(y => x.Language == y.Language 
				                                                  && x.IsForced == y.IsForced 
				                                                  && x.Codec == y.Codec 
				                                                  && x.Type == y.Type);
				return _tracks.Create(x);
			}).ToListAsync());
			return resource;
		}
		
		/// <inheritdoc />
		protected override async Task Validate(Episode resource)
		{
			await base.Validate(resource);
			await resource.ExternalIDs.ForEachAsync(async x => 
			{ 
				x.Second = await _providers.CreateIfNotExists(x.Second);
				x.SecondID = x.Second.ID;
				_database.Entry(x.Second).State = EntityState.Detached;
			});
		}
		
		/// <inheritdoc />
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