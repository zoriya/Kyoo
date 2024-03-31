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
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Postgresql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Core.Controllers;

public class WatchStatusRepository(
	DatabaseContext database,
	IRepository<Movie> movies,
	IRepository<Show> shows,
	IRepository<Episode> episodes,
	IRepository<User> users,
	DbConnection db,
	SqlVariableContext context
) : IWatchStatusRepository
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
	private WatchStatus Planned = WatchStatus.Planned;

	static WatchStatusRepository()
	{
		IRepository<Episode>.OnCreated += async (ep) =>
		{
			await using AsyncServiceScope scope = CoreModule.Services.CreateAsyncScope();
			DatabaseContext db = scope.ServiceProvider.GetRequiredService<DatabaseContext>();
			WatchStatusRepository repo =
				scope.ServiceProvider.GetRequiredService<WatchStatusRepository>();
			List<Guid> users = await db
				.ShowWatchStatus.IgnoreQueryFilters()
				.Where(x => x.ShowId == ep.ShowId && x.Status == WatchStatus.Completed)
				.Select(x => x.UserId)
				.ToListAsync();
			foreach (Guid userId in users)
				await repo._SetShowStatus(
					ep.ShowId,
					userId,
					WatchStatus.Watching,
					newEpisode: true
				);
		};
	}

	// language=PostgreSQL
	protected FormattableString Sql =>
		$"""
			select
				s.*,
				swe.*, -- Episode as swe
				m.*
				/* includes */
			from (
				select
					s.*, -- Show as s
					sw.*,
					sw.added_date as order,
					sw.status as watch_status
				from
					shows as s
					inner join show_watch_status as sw on sw.show_id = s.id
						and sw.user_id = [current_user]) as s
				full outer join (
				select
					m.*, -- Movie as m
					mw.*,
					mw.added_date as order,
					mw.status as watch_status
				from
					movies as m
					inner join movie_watch_status as mw on mw.movie_id = m.id
						and mw.user_id = [current_user]) as m on false
			left join episodes as swe on swe.id = s.next_episode_id
			/* includesJoin */
			where
				(coalesce(s.watch_status, m.watch_status) = 'watching'::watch_status
				or coalesce(s.watch_status, m.watch_status) = 'planned'::watch_status)
				/* where */
			order by
				coalesce(s.order, m.order) desc,
				coalesce(s.id, m.id) asc
			""";

	protected Dictionary<string, Type> Config =>
		new()
		{
			{ "s", typeof(Show) },
			{ "_sw", typeof(ShowWatchStatus) },
			{ "_swe", typeof(Episode) },
			{ "m", typeof(Movie) },
			{ "_mw", typeof(MovieWatchStatus) },
		};

	protected IWatchlist Mapper(List<object?> items)
	{
		if (items[0] is Show show && show.Id != Guid.Empty)
		{
			show.WatchStatus = items[1] as ShowWatchStatus;
			if (show.WatchStatus != null)
				show.WatchStatus.NextEpisode = items[2] as Episode;
			return show;
		}
		if (items[3] is Movie movie && movie.Id != Guid.Empty)
		{
			movie.WatchStatus = items[4] as MovieWatchStatus;
			return movie;
		}
		throw new InvalidDataException();
	}

	/// <inheritdoc/>
	public virtual async Task<IWatchlist> Get(Guid id, Include<IWatchlist>? include = default)
	{
		IWatchlist? ret = await GetOrDefault(id, include);
		if (ret == null)
			throw new ItemNotFoundException($"No {nameof(IWatchlist)} found with the id {id}");
		return ret;
	}

	/// <inheritdoc />
	public Task<IWatchlist?> GetOrDefault(Guid id, Include<IWatchlist>? include = null)
	{
		return db.QuerySingle<IWatchlist>(
			Sql,
			Config,
			Mapper,
			context,
			include,
			new Filter<IWatchlist>.Eq(nameof(IResource.Id), id)
		);
	}

	/// <inheritdoc />
	public async Task<ICollection<IWatchlist>> GetAll(
		Filter<IWatchlist>? filter = default,
		Include<IWatchlist>? include = default,
		Pagination? limit = default
	)
	{
		if (include != null)
			include.Metadatas = include
				.Metadatas.Where(x => x.Name != nameof(Show.WatchStatus))
				.ToList();

		// We can't use the generic after id hanler since the sort depends on a relation.
		if (limit?.AfterID != null)
		{
			dynamic cursor = await Get(limit.AfterID.Value);
			filter = Filter.And(
				filter,
				Filter.Or(
					new Filter<IWatchlist>.Lt("order", cursor.WatchStatus.AddedDate),
					Filter.And(
						new Filter<IWatchlist>.Eq("order", cursor.WatchStatus.AddedDate),
						new Filter<IWatchlist>.Gt("Id", cursor.Id)
					)
				)
			);
			limit.AfterID = null;
		}

		return await db.Query(
			Sql,
			Config,
			Mapper,
			(id) => Get(id),
			context,
			include,
			filter,
			null,
			limit ?? new()
		);
	}

	/// <inheritdoc />
	public Task<MovieWatchStatus?> GetMovieStatus(Guid movieId, Guid userId)
	{
		return database.MovieWatchStatus.FirstOrDefaultAsync(x =>
			x.MovieId == movieId && x.UserId == userId
		);
	}

	/// <inheritdoc />
	public async Task<MovieWatchStatus?> SetMovieStatus(
		Guid movieId,
		Guid userId,
		WatchStatus status,
		int? watchedTime,
		int? percent
	)
	{
		Movie movie = await movies.Get(movieId);

		if (percent == null && watchedTime != null && movie.Runtime > 0)
			percent = (int)Math.Round(watchedTime.Value / (movie.Runtime.Value * 60f) * 100f);

		if (percent < MinWatchPercent)
			return null;
		if (percent > MaxWatchPercent)
		{
			status = WatchStatus.Completed;
			watchedTime = null;
			percent = null;
		}

		if (watchedTime.HasValue && status != WatchStatus.Watching)
			throw new ValidationException(
				"Can't have a watched time if the status is not watching."
			);

		if (watchedTime.HasValue != percent.HasValue)
			throw new ValidationException(
				"Can't specify watched time without specifing percent (or vise-versa)."
					+ "Percent could not be guessed since duration is unknown."
			);

		MovieWatchStatus ret =
			new()
			{
				UserId = userId,
				MovieId = movieId,
				Status = status,
				WatchedTime = watchedTime,
				WatchedPercent = percent,
				AddedDate = DateTime.UtcNow,
				PlayedDate = status == WatchStatus.Completed ? DateTime.UtcNow : null,
			};
		await database
			.MovieWatchStatus.Upsert(ret)
			.UpdateIf(x => status != Watching || x.Status != Completed)
			.RunAsync();
		await IWatchStatusRepository.OnMovieStatusChanged(
			new()
			{
				User = await users.Get(ret.UserId),
				Resource = await movies.Get(ret.MovieId),
				Status = ret.Status,
				WatchedTime = ret.WatchedTime,
				WatchedPercent = ret.WatchedPercent,
				AddedDate = ret.AddedDate,
				PlayedDate = ret.PlayedDate,
			}
		);
		return ret;
	}

	/// <inheritdoc />
	public async Task DeleteMovieStatus(Guid movieId, Guid userId)
	{
		await database
			.MovieWatchStatus.Where(x => x.MovieId == movieId && x.UserId == userId)
			.ExecuteDeleteAsync();
		await IWatchStatusRepository.OnMovieStatusChanged(
			new()
			{
				User = await users.Get(userId),
				Resource = await movies.Get(movieId),
				AddedDate = DateTime.UtcNow,
				Status = WatchStatus.Deleted,
			}
		);
	}

	/// <inheritdoc />
	public Task<ShowWatchStatus?> GetShowStatus(Guid showId, Guid userId)
	{
		return database.ShowWatchStatus.FirstOrDefaultAsync(x =>
			x.ShowId == showId && x.UserId == userId
		);
	}

	/// <inheritdoc />
	public Task<ShowWatchStatus?> SetShowStatus(Guid showId, Guid userId, WatchStatus status) =>
		_SetShowStatus(showId, userId, status);

	private async Task<ShowWatchStatus?> _SetShowStatus(
		Guid showId,
		Guid userId,
		WatchStatus status,
		bool newEpisode = false,
		bool skipStatusUpdate = false
	)
	{
		int unseenEpisodeCount =
			status != WatchStatus.Completed
				? await database
					.Episodes.Where(x => x.ShowId == showId)
					.Where(x =>
						x.Watched!.First(x => x.UserId == userId)!.Status != WatchStatus.Completed
					)
					.CountAsync()
				: 0;
		if (unseenEpisodeCount == 0)
			status = WatchStatus.Completed;

		EpisodeWatchStatus? cursorWatchStatus = null;
		Guid? nextEpisodeId = null;
		if (status == WatchStatus.Watching)
		{
			var cursor = await database
				.Episodes.IgnoreQueryFilters()
				.Where(x => x.ShowId == showId)
				.OrderByDescending(x => x.AbsoluteNumber)
				.ThenByDescending(x => x.SeasonNumber)
				.ThenByDescending(x => x.EpisodeNumber)
				.Select(x => new
				{
					x.Id,
					x.AbsoluteNumber,
					x.SeasonNumber,
					x.EpisodeNumber,
					Status = x.Watched!.First(x => x.UserId == userId)
				})
				.FirstOrDefaultAsync(x =>
					x.Status.Status == WatchStatus.Completed
					|| x.Status.Status == WatchStatus.Watching
				);
			cursorWatchStatus = cursor?.Status;
			nextEpisodeId =
				cursor?.Status.Status == WatchStatus.Watching
					? cursor.Id
					: await database
						.Episodes.IgnoreQueryFilters()
						.Where(x => x.ShowId == showId)
						.OrderBy(x => x.AbsoluteNumber)
						.ThenBy(x => x.SeasonNumber)
						.ThenBy(x => x.EpisodeNumber)
						.Where(x =>
							cursor == null
							|| x.AbsoluteNumber > cursor.AbsoluteNumber
							|| x.SeasonNumber > cursor.SeasonNumber
							|| (
								x.SeasonNumber == cursor.SeasonNumber
								&& x.EpisodeNumber > cursor.EpisodeNumber
							)
						)
						.Select(x => new
						{
							x.Id,
							Status = x.Watched!.FirstOrDefault(x => x.UserId == userId)
						})
						.Where(x => x.Status == null || x.Status.Status != WatchStatus.Completed)
						// The as Guid? is here to add the nullability status of the queryable.
						// Without this, FirstOrDefault returns new Guid() when no result is found (which is 16 0s and invalid in sql).
						.Select(x => x.Id as Guid?)
						.FirstOrDefaultAsync();
		}
		else if (status == WatchStatus.Completed)
		{
			List<Guid> episodes = await database
				.Episodes.Where(x => x.ShowId == showId)
				.Select(x => x.Id)
				.ToListAsync();
			await database
				.EpisodeWatchStatus.UpsertRange(
					episodes.Select(episodeId => new EpisodeWatchStatus
					{
						UserId = userId,
						EpisodeId = episodeId,
						Status = WatchStatus.Completed,
						AddedDate = DateTime.UtcNow,
						PlayedDate = DateTime.UtcNow
					})
				)
				.UpdateIf(x => x.Status == Watching || x.Status == Planned)
				.RunAsync();
		}

		ShowWatchStatus ret =
			new()
			{
				UserId = userId,
				ShowId = showId,
				Status = status,
				AddedDate = DateTime.UtcNow,
				NextEpisodeId = nextEpisodeId,
				WatchedTime =
					cursorWatchStatus?.Status == WatchStatus.Watching
						? cursorWatchStatus.WatchedTime
						: null,
				WatchedPercent =
					cursorWatchStatus?.Status == WatchStatus.Watching
						? cursorWatchStatus.WatchedPercent
						: null,
				UnseenEpisodesCount = unseenEpisodeCount,
				PlayedDate = status == WatchStatus.Completed ? DateTime.UtcNow : null,
			};
		await database
			.ShowWatchStatus.Upsert(ret)
			.UpdateIf(x => status != Watching || x.Status != Completed || newEpisode)
			.RunAsync();
		if (!skipStatusUpdate)
		{
			await IWatchStatusRepository.OnShowStatusChanged(
				new()
				{
					User = await users.Get(ret.UserId),
					Resource = await shows.Get(ret.ShowId),
					Status = ret.Status,
					WatchedTime = ret.WatchedTime,
					WatchedPercent = ret.WatchedPercent,
					AddedDate = ret.AddedDate,
					PlayedDate = ret.PlayedDate,
				}
			);
		}
		return ret;
	}

	/// <inheritdoc />
	public async Task DeleteShowStatus(Guid showId, Guid userId)
	{
		await database
			.ShowWatchStatus.IgnoreAutoIncludes()
			.Where(x => x.ShowId == showId && x.UserId == userId)
			.ExecuteDeleteAsync();
		await database
			.EpisodeWatchStatus.Where(x => x.Episode.ShowId == showId && x.UserId == userId)
			.ExecuteDeleteAsync();
		await IWatchStatusRepository.OnShowStatusChanged(
			new()
			{
				User = await users.Get(userId),
				Resource = await shows.Get(showId),
				AddedDate = DateTime.UtcNow,
				Status = WatchStatus.Deleted,
			}
		);
	}

	/// <inheritdoc />
	public Task<EpisodeWatchStatus?> GetEpisodeStatus(Guid episodeId, Guid userId)
	{
		return database.EpisodeWatchStatus.FirstOrDefaultAsync(x =>
			x.EpisodeId == episodeId && x.UserId == userId
		);
	}

	/// <inheritdoc />
	public async Task<EpisodeWatchStatus?> SetEpisodeStatus(
		Guid episodeId,
		Guid userId,
		WatchStatus status,
		int? watchedTime,
		int? percent
	)
	{
		Episode episode = await episodes.Get(episodeId);

		if (percent == null && watchedTime != null && episode.Runtime > 0)
			percent = (int)Math.Round(watchedTime.Value / (episode.Runtime.Value * 60f) * 100f);

		if (percent < MinWatchPercent)
			return null;
		if (percent > MaxWatchPercent)
		{
			status = WatchStatus.Completed;
			watchedTime = null;
			percent = null;
		}

		if (watchedTime.HasValue && status != WatchStatus.Watching)
			throw new ValidationException(
				"Can't have a watched time if the status is not watching."
			);

		if (watchedTime.HasValue != percent.HasValue)
			throw new ValidationException(
				"Can't specify watched time without specifing percent (or vise-versa)."
					+ "Percent could not be guessed since duration is unknown."
			);

		EpisodeWatchStatus ret =
			new()
			{
				UserId = userId,
				EpisodeId = episodeId,
				Status = status,
				WatchedTime = watchedTime,
				WatchedPercent = percent,
				AddedDate = DateTime.UtcNow,
				PlayedDate = status == WatchStatus.Completed ? DateTime.UtcNow : null,
			};
		await database
			.EpisodeWatchStatus.Upsert(ret)
			.UpdateIf(x => status != Watching || x.Status != Completed)
			.RunAsync();
		await IWatchStatusRepository.OnEpisodeStatusChanged(
			new()
			{
				User = await users.Get(ret.UserId),
				Resource = await episodes.Get(episodeId, new(nameof(Episode.Show))),
				Status = ret.Status,
				WatchedTime = ret.WatchedTime,
				WatchedPercent = ret.WatchedPercent,
				AddedDate = ret.AddedDate,
				PlayedDate = ret.PlayedDate,
			}
		);
		await _SetShowStatus(episode.ShowId, userId, WatchStatus.Watching, skipStatusUpdate: true);
		return ret;
	}

	/// <inheritdoc />
	public async Task DeleteEpisodeStatus(Guid episodeId, Guid userId)
	{
		await database
			.EpisodeWatchStatus.Where(x => x.EpisodeId == episodeId && x.UserId == userId)
			.ExecuteDeleteAsync();
		await IWatchStatusRepository.OnEpisodeStatusChanged(
			new()
			{
				User = await users.Get(userId),
				Resource = await episodes.Get(episodeId, new(nameof(Episode.Show))),
				AddedDate = DateTime.UtcNow,
				Status = WatchStatus.Deleted,
			}
		);
	}
}
