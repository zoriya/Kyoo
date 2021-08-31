using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Database;
using Kyoo.Utils;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers
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
				.Where(x => x.EpisodeNumber != null || x.AbsoluteNumber != null)
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
			await _database.SaveChangesAsync($"Trying to insert a duplicated episode (slug {obj.Slug} already exists).");
			return await ValidateTracks(obj);
		}

		/// <inheritdoc />
		protected override async Task EditRelations(Episode resource, Episode changed, bool resetOld)
		{
			await Validate(changed);

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
		}

		/// <summary>
		/// Set track's index and ensure that every tracks is well-formed.
		/// </summary>
		/// <param name="resource">The resource to fix.</param>
		/// <returns>The <see cref="resource"/> parameter is returned.</returns>
		private async Task<Episode> ValidateTracks(Episode resource)
		{
			if (resource.Tracks == null)
				return resource;
			
			resource.Tracks = await resource.Tracks.SelectAsync(x =>
			{
				x.Episode = resource;
				x.EpisodeSlug = resource.Slug;
				return _tracks.Create(x);
			}).ToListAsync();
			_database.Tracks.AttachRange(resource.Tracks);
			return resource;
		}
		
		/// <inheritdoc />
		protected override async Task Validate(Episode resource)
		{
			await base.Validate(resource);
			if (resource.ShowID <= 0)
			{
				if (resource.Show == null)
					throw new ArgumentException($"Can't store an episode not related " +
						$"to any show (showID: {resource.ShowID}).");
				resource.ShowID = resource.Show.ID;
			}

			if (resource.ExternalIDs != null)
			{
				foreach (MetadataID id in resource.ExternalIDs)
				{
					id.Provider = _database.LocalEntity<Provider>(id.Provider.Slug)
						?? await _providers.CreateIfNotExists(id.Provider);
					id.ProviderID = id.Provider.ID;
				}
				_database.MetadataIds<Episode>().AttachRange(resource.ExternalIDs);
			}
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