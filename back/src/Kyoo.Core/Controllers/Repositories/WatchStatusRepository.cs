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
using System.ComponentModel.DataAnnotations;
using System.Data.Common;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Postgresql;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers;

public class WatchStatusRepository : DapperRepository<IWatchlist>, IWatchStatusRepository
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

	// Those two are defined here because x => WatchingStatus.Watching complies to x => 1
	// but x => Watching compiles to x => Convert.ToInt(WatchingStatus.Watching)
	// The second one can be converted to sql wherase the first can't (tries to compare WatchStatus with int).
	private WatchStatus Watching = WatchStatus.Watching;
	private WatchStatus Completed = WatchStatus.Completed;

	private readonly DatabaseContext _database;
	private readonly IRepository<Episode> _episodes;
	private readonly IRepository<Movie> _movies;

	public WatchStatusRepository(DatabaseContext database,
		IRepository<Episode> episodes,
		IRepository<Movie> movies,
		DbConnection db,
		SqlVariableContext context)
		: base(db, context)
	{
		_database = database;
		_episodes = episodes;
		_movies = movies;
	}

	// language=PostgreSQL
	protected override FormattableString Sql => $"""
		select
			s.*,
			m.*,
			e.*
			/* includes */
		from (
			select
				s.* -- Show as s
			from
				shows as s
				inner join show_watch_status as sw on sw.show_id = s.id
					and sw.user_id = [current_user]) as s
			full outer join (
			select
				m.* -- Movie as m
			from
				movies as m
				inner join movie_watch_status as mw on mw.movie_id = m.id
					and mw.user_id = [current_user]) as s) as m
			full outer join (
			select
				e.* -- Episode as e
			from
				episode as es
				inner join episode_watch_status as ew on ew.episode_id = e.id
					and ew.user_id = [current_user])) as e
		""";

	protected override Dictionary<string, Type> Config => new()
		{
			{ "s", typeof(Show) },
			{ "m", typeof(Movie) },
			{ "e", typeof(Episode) },
		};

	protected override IWatchlist Mapper(List<object?> items)
	{
		if (items[0] is Show show && show.Id != Guid.Empty)
			return show;
		if (items[1] is Movie movie && movie.Id != Guid.Empty)
			return movie;
		if (items[2] is Episode episode && episode.Id != Guid.Empty)
			return episode;
		throw new InvalidDataException();
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
			AddedDate = DateTime.UtcNow,
			PlayedDate = status == WatchStatus.Completed ? DateTime.UtcNow : null,
		};
		await _database.MovieWatchStatus.Upsert(ret)
			.UpdateIf(x => status != Watching || x.Status != Completed)
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

		Episode? cursor = null;
		Guid? nextEpisodeId = null;
		if (status == WatchStatus.Watching)
		{
			cursor = await _episodes.GetOrDefault(
				new Filter<Episode>.Lambda(
					x => x.ShowId == showId
						&& (x.WatchStatus!.Status == WatchStatus.Completed
							|| x.WatchStatus.Status == WatchStatus.Watching)
				),
				new Include<Episode>(nameof(Episode.WatchStatus)),
				reverse: true
			);
			nextEpisodeId = cursor?.WatchStatus?.Status == WatchStatus.Watching
				? cursor.Id
				: ((await _episodes.GetOrDefault(
					new Filter<Episode>.Lambda(
						x => x.ShowId == showId && x.WatchStatus!.Status != WatchStatus.Completed
					),
					afterId: cursor?.Id
				))?.Id);
		}

		ShowWatchStatus ret = new()
		{
			UserId = userId,
			ShowId = showId,
			Status = status,
			AddedDate = DateTime.UtcNow,
			NextEpisodeId = nextEpisodeId,
			WatchedTime = cursor?.WatchStatus?.Status == WatchStatus.Watching
				? cursor.WatchStatus.WatchedTime
				: null,
			WatchedPercent = cursor?.WatchStatus?.Status == WatchStatus.Watching
				? cursor.WatchStatus.WatchedPercent
				: null,
			UnseenEpisodesCount = unseenEpisodeCount,
			PlayedDate = status == WatchStatus.Completed ? DateTime.UtcNow : null,
		};
		await _database.ShowWatchStatus.Upsert(ret)
			.UpdateIf(x => status != Watching || x.Status != Completed)
			.RunAsync();
		return ret;
	}

	/// <inheritdoc />
	public async Task DeleteShowStatus(
		Guid showId,
		Guid userId)
	{
		await _database.ShowWatchStatus
			.IgnoreAutoIncludes()
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
			AddedDate = DateTime.UtcNow,
			PlayedDate = status == WatchStatus.Completed ? DateTime.UtcNow : null,
		};
		await _database.EpisodeWatchStatus.Upsert(ret)
			.UpdateIf(x => status != Watching || x.Status != Completed)
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
