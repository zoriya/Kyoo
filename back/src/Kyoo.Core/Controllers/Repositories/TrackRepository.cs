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
using Kyoo.Postgresql;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A local repository to handle tracks.
	/// </summary>
	public class TrackRepository : LocalRepository<Track>, ITrackRepository
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;

		/// <inheritdoc />
		protected override Sort<Track> DefaultSort => new Sort<Track>.By(x => x.TrackIndex);

		/// <summary>
		/// Create a new <see cref="TrackRepository"/>.
		/// </summary>
		/// <param name="database">The database handle</param>
		/// <param name="episodes">The episode repository</param>
		public TrackRepository(DatabaseContext database, IEpisodeRepository episodes)
			: base(database)
		{
			_database = database;

			// Edit tracks slugs when the episodes's slug changes.
			episodes.OnEdited += (ep) =>
			{
				List<Track> tracks = _database.Tracks.AsTracking().Where(x => x.EpisodeID == ep.ID).ToList();
				foreach (Track track in tracks)
				{
					track.EpisodeSlug = ep.Slug;
					_database.SaveChanges();
					OnResourceEdited(track);
				}
			};
		}

		/// <inheritdoc />
		public override Task<ICollection<Track>> Search(string query)
		{
			throw new InvalidOperationException("Tracks do not support the search method.");
		}

		/// <inheritdoc />
		protected override async Task Validate(Track resource)
		{
			await base.Validate(resource);
			if (resource.EpisodeID <= 0)
			{
				resource.EpisodeID = resource.Episode?.ID ?? 0;
				if (resource.EpisodeID <= 0)
				{
					throw new ArgumentException("Can't store a track not related to any episode " +
						$"(episodeID: {resource.EpisodeID}).");
				}
			}
		}

		/// <inheritdoc />
		public override async Task<Track> Create(Track obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			await base.Create(obj);
			obj.EpisodeSlug = _database.Episodes.First(x => x.ID == obj.EpisodeID).Slug;
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync();
			OnResourceCreated(obj);
			return obj;
		}

		/// <inheritdoc />
		public override async Task Delete(Track obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
			await base.Delete(obj);
		}
	}
}
