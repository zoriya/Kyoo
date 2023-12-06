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
using System.Threading.Tasks;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Utils;

namespace Kyoo.Abstractions.Controllers;

/// <summary>
/// A local repository to handle watched items
/// </summary>
public interface IWatchStatusRepository
{
	// /// <summary>
	// /// The event handler type for all events of this repository.
	// /// </summary>
	// /// <param name="resource">The resource created/modified/deleted</param>
	// /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
	// public delegate Task ResourceEventHandler(T resource);

	Task<ICollection<IWatchlist>> GetAll(
		Include<IWatchlist>? include = default,
		Pagination? limit = default);

	Task<MovieWatchStatus?> GetMovieStatus(Guid movieId, Guid userId);

	Task<MovieWatchStatus?> SetMovieStatus(Guid movieId, Guid userId, WatchStatus status, int? watchedTime);

	Task DeleteMovieStatus(Guid movieId, Guid userId);

	Task<ShowWatchStatus?> GetShowStatus(Guid showId, Guid userId);

	Task<ShowWatchStatus?> SetShowStatus(Guid showId, Guid userId, WatchStatus status);

	Task DeleteShowStatus(Guid showId, Guid userId);

	Task<EpisodeWatchStatus?> GetEpisodeStatus(Guid episodeId, Guid userId);

	/// <param name="watchedTime">Where the user has stopped watching. Only usable if Status
	/// is <see cref="WatchStatus.Watching"/></param>
	Task<EpisodeWatchStatus?> SetEpisodeStatus(Guid episodeId, Guid userId, WatchStatus status, int? watchedTime);

	Task DeleteEpisodeStatus(Guid episodeId, Guid userId);
}
