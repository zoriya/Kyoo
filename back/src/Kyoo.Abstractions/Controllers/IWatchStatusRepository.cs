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
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Abstractions.Models;

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

	/// <summary>
	/// Get the watch status of a movie
	/// </summary>
	/// <param name="where">The movie selector.</param>
	/// <param name="userId">The id of the user.</param>
	/// <returns>The movie's status</returns>
	Task<MovieWatchStatus?> GetMovieStatus(Expression<Func<Movie, bool>> where, int userId);

	/// <summary>
	/// Set the watch status of a movie
	/// </summary>
	/// <param name="movieId">The id of the movie.</param>
	/// <param name="userId">The id of the user.</param>
	/// <param name="status">The new status.</param>
	/// <param name="watchedTime">Where the user has stopped watching. Only usable if Status
	/// is <see cref="WatchStatus.Watching"/></param>
	/// <returns>The movie's status</returns>
	Task<MovieWatchStatus?> SetMovieStatus(int movieId, int userId, WatchStatus status, int? watchedTime);

	/// <summary>
	/// Delete the watch status of a movie.
	/// </summary>
	/// <param name="where">The movie selector.</param>
	/// <param name="userId">The id of the user.</param>
	/// <returns>Nothing.</returns>
	Task DeleteMovieStatus(Expression<Func<Movie, bool>> where, int userId);

	/// <summary>
	/// Get the watch status of a show.
	/// </summary>
	/// <param name="where">The show selector.</param>
	/// <param name="userId">The id of the user.</param>
	/// <returns>The show's status</returns>
	Task<ShowWatchStatus?> GetShowStatus(Expression<Func<Show, bool>> where, int userId);

	/// <summary>
	/// Set the watch status of a show.
	/// </summary>
	/// <param name="showId">The id of the movie.</param>
	/// <param name="userId">The id of the user.</param>
	/// <param name="status">The new status.</param>
	/// <returns>The shows's status</returns>
	Task<ShowWatchStatus?> SetShowStatus(int showId, int userId, WatchStatus status);

	/// <summary>
	/// Delete the watch status of a show.
	/// </summary>
	/// <param name="where">The show selector.</param>
	/// <param name="userId">The id of the user.</param>
	/// <returns>Nothing.</returns>
	Task DeleteShowStatus(Expression<Func<Show, bool>> where, int userId);

	/// <summary>
	/// Get the watch status of an episode.
	/// </summary>
	/// <param name="where">The episode selector.</param>
	/// <param name="userId">The id of the user.</param>
	/// <returns>The episode's status</returns>
	Task<EpisodeWatchStatus?> GetEpisodeStatus(Expression<Func<Episode, bool>> where, int userId);

	/// <summary>
	/// Set the watch status of an episode.
	/// </summary>
	/// <param name="episodeId">The id of the episode.</param>
	/// <param name="userId">The id of the user.</param>
	/// <param name="status">The new status.</param>
	/// <param name="watchedTime">Where the user has stopped watching. Only usable if Status
	/// is <see cref="WatchStatus.Watching"/></param>
	/// <returns>The episode's status</returns>
	Task<EpisodeWatchStatus?> SetEpisodeStatus(int episodeId, int userId, WatchStatus status, int? watchedTime);

	/// <summary>
	/// Delete the watch status of an episode.
	/// </summary>
	/// <param name="where">The episode selector.</param>
	/// <param name="userId">The id of the user.</param>
	/// <returns>Nothing.</returns>
	Task DeleteEpisodeStatus(Expression<Func<Episode, bool>> where, int userId);
}
