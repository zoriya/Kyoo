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
using Kyoo.Postgresql;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers;

public class WatchStatusRepository : IWatchStatusRepository
{
	private readonly DatabaseContext _database;
	private readonly IRepository<Episode> _episodes;

	public WatchStatusRepository(DatabaseContext database, IRepository<Episode> episodes)
	{
		_database = database;
		_episodes = episodes;
	}

	/// <inheritdoc />
	public Task<MovieWatchStatus?> GetMovieStatus(Expression<Func<Movie, bool>> where, int userId)
	{
		return _database.MovieWatchInfo.FirstOrDefaultAsync(x =>
			x.Movie == _database.Movies.FirstOrDefault(where)
			&& x.UserId == userId
		);
	}

	/// <inheritdoc />
	public async Task<MovieWatchStatus> SetMovieStatus(
		int movieId,
		int userId,
		WatchStatus status,
		int? watchedTime)
	{
		if (watchedTime.HasValue && status != WatchStatus.Watching)
			throw new ValidationException("Can't have a watched time if the status is not watching.");
		MovieWatchStatus ret = new()
		{
			UserId = userId,
			MovieId = movieId,
			Status = status,
			WatchedTime = watchedTime,
		};
		await _database.MovieWatchInfo.Upsert(ret)
			.UpdateIf(x => !(status == WatchStatus.Watching && x.Status == WatchStatus.Completed))
			.RunAsync();
		return ret;
	}

	/// <inheritdoc />
	public Task<ShowWatchStatus?> GetShowStatus(Expression<Func<Show, bool>> where, int userId)
	{
		return _database.ShowWatchInfo.FirstOrDefaultAsync(x =>
			x.Show == _database.Shows.FirstOrDefault(where)
			&& x.UserId == userId
		);
	}

	/// <inheritdoc />
	public async Task<ShowWatchStatus> SetShowStatus(
		int showId,
		int userId,
		WatchStatus status)
	{
		ShowWatchStatus ret = new()
		{
			UserId = userId,
			ShowId = showId,
			Status = status,
			NextEpisode = status == WatchStatus.Watching
				? await _episodes.GetOrDefault(
					where: x => x.ShowId == showId
						&& (x.WatchStatus!.Status == WatchStatus.Watching
							|| x.WatchStatus.Status == WatchStatus.Completed),
					reverse: true
				)
				: null,
		};
		await _database.ShowWatchInfo.Upsert(ret)
			.UpdateIf(x => !(status == WatchStatus.Watching && x.Status == WatchStatus.Completed))
			.RunAsync();
		return ret;
	}

	/// <inheritdoc />
	public Task<EpisodeWatchStatus?> GetEpisodeStatus(Expression<Func<Episode, bool>> where, int userId)
	{
		return _database.EpisodeWatchInfo.FirstOrDefaultAsync(x =>
			x.Episode == _database.Episodes.FirstOrDefault(where)
			&& x.UserId == userId
		);
	}

	/// <inheritdoc />
	public async Task<EpisodeWatchStatus> SetEpisodeStatus(
		int episodeId,
		int userId,
		WatchStatus status,
		int? watchedTime)
	{
		Episode episode = await _episodes.Get(episodeId);
		if (watchedTime.HasValue && status != WatchStatus.Watching)
			throw new ValidationException("Can't have a watched time if the status is not watching.");
		EpisodeWatchStatus ret = new()
		{
			UserId = userId,
			EpisodeId = episodeId,
			Status = status,
			WatchedTime = watchedTime,
		};
		await _database.EpisodeWatchInfo.Upsert(ret).RunAsync();
		await SetShowStatus(episode.ShowId, userId, WatchStatus.Watching);
		return ret;
	}
}
