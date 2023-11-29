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
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Postgresql;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers;

public class WatchStatusRepository : IWatchStatusRepository
{
	/// <summary>
	/// If the watch percent is below this value, don't consider the item started.
	/// </summary>
	public const int MinWatchPercent = 5;

	/// <summary>
	/// If the watch percent is higher than this value, consider the item completed.
	/// </summary>
	/// <remarks>
	/// This value is lower to account credits in movies that can last really long.
	/// </remarks>
	public const int MaxWatchPercent = 90;

	private readonly DatabaseContext _database;
	private readonly IRepository<Episode> _episodes;
	private readonly IRepository<Movie> _movies;

	public WatchStatusRepository(DatabaseContext database,
		IRepository<Episode> episodes,
		IRepository<Movie> movies)
	{
		_database = database;
		_episodes = episodes;
		_movies = movies;
	}

	/// <inheritdoc />
	public Task<MovieWatchStatus?> GetMovieStatus(Guid movieId, Guid userId)
	{
		return _database.MovieWatchStatus.FirstOrDefaultAsync(x => x.MovieId == movieId && x.UserId == userId);
	}

	/// <inheritdoc />
	public async Task<MovieWatchStatus?> SetMovieStatus(
		Guid movieId,
		Guid userId,
		WatchStatus status,
		int? watchedTime)
	{
		Movie movie = await _movies.Get(movieId);
		int? percent = watchedTime != null && movie.Runtime > 0
			? (int)Math.Round(watchedTime.Value / (movie.Runtime * 60f) * 100f)
			: null;

		if (percent < MinWatchPercent)
			return null;
		if (percent > MaxWatchPercent)
		{
			status = WatchStatus.Completed;
			watchedTime = null;
			percent = null;
		}

		if (watchedTime.HasValue && status != WatchStatus.Watching)
			throw new ValidationException("Can't have a watched time if the status is not watching.");

		MovieWatchStatus ret = new()
		{
			UserId = userId,
			MovieId = movieId,
			Status = status,
			WatchedTime = watchedTime,
			PlayedDate = DateTime.UtcNow
		};
		await _database.MovieWatchStatus.Upsert(ret)
			.UpdateIf(x => !(status == WatchStatus.Watching && x.Status == WatchStatus.Completed))
			.RunAsync();
		return ret;
	}

	/// <inheritdoc />
	public async Task DeleteMovieStatus(
		Guid movieId,
		Guid userId)
	{
		await _database.MovieWatchStatus
			.Where(x => x.MovieId == movieId && x.UserId == userId)
			.ExecuteDeleteAsync();
	}

	/// <inheritdoc />
	public Task<ShowWatchStatus?> GetShowStatus(Guid showId, Guid userId)
	{
		return _database.ShowWatchStatus.FirstOrDefaultAsync(x => x.ShowId == showId && x.UserId == userId);
	}

	/// <inheritdoc />
	public async Task<ShowWatchStatus?> SetShowStatus(
		Guid showId,
		Guid userId,
		WatchStatus status)
	{
		int unseenEpisodeCount = await _database.Episodes
			.Where(x => x.ShowId == showId)
			.Where(x => x.WatchStatus!.Status != WatchStatus.Completed)
			.CountAsync();
		if (unseenEpisodeCount == 0)
			status = WatchStatus.Completed;

		ShowWatchStatus ret = new()
		{
			UserId = userId,
			ShowId = showId,
			Status = status,
			NextEpisode = status == WatchStatus.Watching
				? await _episodes.GetOrDefault(
					new Filter<Episode>.Lambda(
						x => x.ShowId == showId
							&& (x.WatchStatus!.Status == WatchStatus.Watching
								|| x.WatchStatus.Status == WatchStatus.Completed)
					),
					reverse: true
				)
				: null,
			UnseenEpisodesCount = unseenEpisodeCount,
			PlayedDate = DateTime.UtcNow
		};
		await _database.ShowWatchStatus.Upsert(ret)
			.UpdateIf(x => !(status == WatchStatus.Watching && x.Status == WatchStatus.Completed))
			.RunAsync();
		return ret;
	}

	/// <inheritdoc />
	public async Task DeleteShowStatus(
		Guid showId,
		Guid userId)
	{
		await _database.ShowWatchStatus
			.Where(x => x.ShowId == showId && x.UserId == userId)
			.ExecuteDeleteAsync();
		await _database.EpisodeWatchStatus
			.Where(x => x.Episode.ShowId == showId && x.UserId == userId)
			.ExecuteDeleteAsync();
	}

	/// <inheritdoc />
	public Task<EpisodeWatchStatus?> GetEpisodeStatus(Guid episodeId, Guid userId)
	{
		return _database.EpisodeWatchStatus.FirstOrDefaultAsync(x => x.EpisodeId == episodeId && x.UserId == userId);
	}

	/// <inheritdoc />
	public async Task<EpisodeWatchStatus?> SetEpisodeStatus(
		Guid episodeId,
		Guid userId,
		WatchStatus status,
		int? watchedTime)
	{
		Episode episode = await _episodes.Get(episodeId);
		int? percent = watchedTime != null && episode.Runtime > 0
			? (int)Math.Round(watchedTime.Value / (episode.Runtime * 60f) * 100f)
			: null;

		if (percent < MinWatchPercent)
			return null;
		if (percent > MaxWatchPercent)
		{
			status = WatchStatus.Completed;
			watchedTime = null;
			percent = null;
		}

		if (watchedTime.HasValue && status != WatchStatus.Watching)
			throw new ValidationException("Can't have a watched time if the status is not watching.");

		EpisodeWatchStatus ret = new()
		{
			UserId = userId,
			EpisodeId = episodeId,
			Status = status,
			WatchedTime = watchedTime,
			WatchedPercent = percent,
			PlayedDate = DateTime.UtcNow
		};
		await _database.EpisodeWatchStatus.Upsert(ret)
			.UpdateIf(x => !(status == WatchStatus.Watching && x.Status == WatchStatus.Completed))
			.RunAsync();
		await SetShowStatus(episode.ShowId, userId, WatchStatus.Watching);
		return ret;
	}

	/// <inheritdoc />
	public async Task DeleteEpisodeStatus(
		Guid episodeId,
		Guid userId)
	{
		await _database.EpisodeWatchStatus
			.Where(x => x.EpisodeId == episodeId && x.UserId == userId)
			.ExecuteDeleteAsync();
	}
}
