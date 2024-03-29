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
	public delegate Task ResourceEventHandler<T>(T resource);

	Task<ICollection<IWatchlist>> GetAll(
		Filter<IWatchlist>? filter = default,
		Include<IWatchlist>? include = default,
		Pagination? limit = default
	);

	Task<MovieWatchStatus?> GetMovieStatus(Guid movieId, Guid userId);

	Task<MovieWatchStatus?> SetMovieStatus(
		Guid movieId,
		Guid userId,
		WatchStatus status,
		int? watchedTime,
		int? percent
	);

	static event ResourceEventHandler<WatchStatus<Movie>> OnMovieStatusChangedHandler;
	protected static Task OnMovieStatusChanged(WatchStatus<Movie> obj) =>
		OnMovieStatusChangedHandler?.Invoke(obj) ?? Task.CompletedTask;

	Task DeleteMovieStatus(Guid movieId, Guid userId);

	Task<ShowWatchStatus?> GetShowStatus(Guid showId, Guid userId);

	Task<ShowWatchStatus?> SetShowStatus(Guid showId, Guid userId, WatchStatus status);

	static event ResourceEventHandler<WatchStatus<Show>> OnShowStatusChangedHandler;
	protected static Task OnShowStatusChanged(WatchStatus<Show> obj) =>
		OnShowStatusChangedHandler?.Invoke(obj) ?? Task.CompletedTask;

	Task DeleteShowStatus(Guid showId, Guid userId);

	Task<EpisodeWatchStatus?> GetEpisodeStatus(Guid episodeId, Guid userId);

	/// <param name="watchedTime">Where the user has stopped watching. Only usable if Status
	/// is <see cref="WatchStatus.Watching"/></param>
	Task<EpisodeWatchStatus?> SetEpisodeStatus(
		Guid episodeId,
		Guid userId,
		WatchStatus status,
		int? watchedTime,
		int? percent
	);

	static event ResourceEventHandler<WatchStatus<Episode>> OnEpisodeStatusChangedHandler;
	protected static Task OnEpisodeStatusChanged(WatchStatus<Episode> obj) =>
		OnEpisodeStatusChangedHandler?.Invoke(obj) ?? Task.CompletedTask;

	Task DeleteEpisodeStatus(Guid episodeId, Guid userId);
}
