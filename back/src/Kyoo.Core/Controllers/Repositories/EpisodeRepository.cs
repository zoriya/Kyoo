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

		private readonly IShowRepository _shows;

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
		public EpisodeRepository(DatabaseContext database,
			IShowRepository shows)
			: base(database)
		{
			_database = database;
			_shows = shows;

			// Edit episode slugs when the show's slug changes.
			shows.OnEdited += (show) =>
			{
				List<Episode> episodes = _database.Episodes.AsTracking().Where(x => x.ShowId == show.Id).ToList();
				foreach (Episode ep in episodes)
				{
					ep.ShowSlug = show.Slug;
					_database.SaveChanges();
					OnResourceEdited(ep);
				}
			};
		}

		/// <inheritdoc />
		public Task<Episode> GetOrDefault(int showID, int seasonNumber, int episodeNumber)
		{
			return _database.Episodes.FirstOrDefaultAsync(x => x.ShowId == showID
				&& x.SeasonNumber == seasonNumber
				&& x.EpisodeNumber == episodeNumber).Then(SetBackingImage);
		}

		/// <inheritdoc />
		public Task<Episode> GetOrDefault(string showSlug, int seasonNumber, int episodeNumber)
		{
			return _database.Episodes.FirstOrDefaultAsync(x => x.Show.Slug == showSlug
				&& x.SeasonNumber == seasonNumber
				&& x.EpisodeNumber == episodeNumber).Then(SetBackingImage);
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
			return _database.Episodes.FirstOrDefaultAsync(x => x.ShowId == showID
				&& x.AbsoluteNumber == absoluteNumber).Then(SetBackingImage);
		}

		/// <inheritdoc />
		public Task<Episode> GetAbsolute(string showSlug, int absoluteNumber)
		{
			return _database.Episodes.FirstOrDefaultAsync(x => x.Show.Slug == showSlug
				&& x.AbsoluteNumber == absoluteNumber).Then(SetBackingImage);
		}

		/// <inheritdoc />
		public override async Task<ICollection<Episode>> Search(string query)
		{
			List<Episode> ret = await Sort(
				_database.Episodes
					.Include(x => x.Show)
					.Where(x => x.EpisodeNumber != null || x.AbsoluteNumber != null)
					.Where(_database.Like<Episode>(x => x.Name, $"%{query}%"))
				)
				.Take(20)
				.ToListAsync();
			foreach (Episode ep in ret)
			{
				ep.Show.Episodes = null;
				SetBackingImage(ep);
			}
			return ret;
		}

		/// <inheritdoc />
		public override async Task<Episode> Create(Episode obj)
		{
			await base.Create(obj);
			obj.ShowSlug = obj.Show?.Slug ?? _database.Shows.First(x => x.Id == obj.ShowId).Slug;
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync(() =>
				obj.SeasonNumber != null && obj.EpisodeNumber != null
				? Get(obj.ShowId, obj.SeasonNumber.Value, obj.EpisodeNumber.Value)
				: GetAbsolute(obj.ShowId, obj.AbsoluteNumber.Value));
			OnResourceCreated(obj);
			return obj;
		}

		/// <inheritdoc />
		protected override async Task Validate(Episode resource)
		{
			await base.Validate(resource);
			if (resource.ShowId <= 0)
			{
				if (resource.Show == null)
				{
					throw new ArgumentException($"Can't store an episode not related " +
						$"to any show (showID: {resource.ShowId}).");
				}
				resource.ShowId = resource.Show.Id;
			}
		}

		/// <inheritdoc />
		public override async Task Delete(Episode obj)
		{
			int epCount = await _database.Episodes.Where(x => x.ShowId == obj.ShowId).Take(2).CountAsync();
			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
			await base.Delete(obj);
			if (epCount == 1)
				await _shows.Delete(obj.ShowId);
		}
	}
}
