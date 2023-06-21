// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Postgresql;
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
		// Use absolute numbers by default and fallback to season/episodes if it does not exists.
		protected override Sort<Episode> DefaultSort => new Sort<Episode>.Conglomerate(
			new Sort<Episode>.By(x => x.AbsoluteNumber),
			new Sort<Episode>.By(x => x.SeasonNumber),
			new Sort<Episode>.By(x => x.EpisodeNumber)
		);

		/// <summary>
		/// Create a new <see cref="EpisodeRepository"/>.
		/// </summary>
		/// <param name="database">The database handle to use.</param>
		/// <param name="shows">A show repository</param>
		/// <param name="providers">A provider repository</param>
		/// <param name="tracks">A track repository</param>
		public EpisodeRepository(DatabaseContext database,
			IShowRepository shows,
			IProviderRepository providers,
			ITrackRepository tracks)
			: base(database)
		{
			_database = database;
			_providers = providers;
			_tracks = tracks;

			// Edit episode slugs when the show's slug changes.
			shows.OnEdited += async (show) =>
			{
				foreach (Episode ep in _database.Episodes.Where(x => x.ShowID == show.ID))
					ep.ShowSlug = show.Slug;
				await _database.SaveChangesAsync();
			};
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
			List<Episode> ret = await Sort(
				_database.Episodes
					.Include(x => x.Show)
					.Where(x => x.EpisodeNumber != null || x.AbsoluteNumber != null)
					.Where(_database.Like<Episode>(x => x.Title, $"%{query}%"))
				)
				.Take(20)
				.ToListAsync();
			foreach (Episode ep in ret)
				ep.Show.Episodes = null;
			return ret;
		}

		/// <inheritdoc />
		public override async Task<Episode> Create(Episode obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync(() =>
				obj.SeasonNumber != null && obj.EpisodeNumber != null
				? Get(obj.ShowID, obj.SeasonNumber.Value, obj.EpisodeNumber.Value)
				: GetAbsolute(obj.ShowID, obj.AbsoluteNumber.Value));
			OnResourceCreated(obj);
			return await _ValidateTracks(obj);
		}

		/// <inheritdoc />
		protected override async Task EditRelations(Episode resource, Episode changed, bool resetOld)
		{
			await Validate(changed);

			if (changed.Tracks != null || resetOld)
			{
				await _tracks.DeleteAll(x => x.EpisodeID == resource.ID);
				resource.Tracks = changed.Tracks;
				await _ValidateTracks(resource);
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
		/// <returns>The <paramref name="resource"/> parameter is returned.</returns>
		private async Task<Episode> _ValidateTracks(Episode resource)
		{
			if (resource.Tracks == null)
				return resource;

			resource.Tracks = await resource.Tracks.SelectAsync(x =>
			{
				x.Episode = resource;
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
				{
					throw new ArgumentException($"Can't store an episode not related " +
						$"to any show (showID: {resource.ShowID}).");
				}
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
			await base.Delete(obj);
		}
	}
}
