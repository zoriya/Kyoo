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
using System.Text.Json.Serialization;
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Abstractions.Models;

/// <summary>
/// Has the user started watching, is it planned?
/// </summary>
public enum WatchStatus
{
	/// <summary>
	/// The user has already watched this.
	/// </summary>
	Completed,

	/// <summary>
	/// The user started watching this but has not finished.
	/// </summary>
	Watching,

	/// <summary>
	/// The user does not plan to continue watching.
	/// </summary>
	Droped,

	/// <summary>
	/// The user has not started watching this but plans to.
	/// </summary>
	Planned,
}

/// <summary>
/// Metadata of what an user as started/planned to watch.
/// </summary>
[SqlFirstColumn(nameof(UserId))]
public class MovieWatchStatus : IAddedDate
{
	/// <summary>
	/// The ID of the user that started watching this episode.
	/// </summary>
	public Guid UserId { get; set; }

	/// <summary>
	/// The user that started watching this episode.
	/// </summary>
	[JsonIgnore]
	public User User { get; set; }

	/// <summary>
	/// The ID of the movie started.
	/// </summary>
	public Guid MovieId { get; set; }

	/// <summary>
	/// The <see cref="Movie"/> started.
	/// </summary>
	[JsonIgnore]
	public Movie Movie { get; set; }

	/// <inheritdoc/>
	public DateTime AddedDate { get; set; }

	/// <summary>
	/// The date at which this item was played.
	/// </summary>
	public DateTime? PlayedDate { get; set; }

	/// <summary>
	/// Has the user started watching, is it planned?
	/// </summary>
	public WatchStatus Status { get; set; }

	/// <summary>
	/// Where the player has stopped watching the movie (in seconds).
	/// </summary>
	/// <remarks>
	/// Null if the status is not Watching.
	/// </remarks>
	public int? WatchedTime { get; set; }

	/// <summary>
	/// Where the player has stopped watching the movie (in percentage between 0 and 100).
	/// </summary>
	/// <remarks>
	/// Null if the status is not Watching.
	/// </remarks>
	public int? WatchedPercent { get; set; }
}

[SqlFirstColumn(nameof(UserId))]
public class EpisodeWatchStatus : IAddedDate
{
	/// <summary>
	/// The ID of the user that started watching this episode.
	/// </summary>
	public Guid UserId { get; set; }

	/// <summary>
	/// The user that started watching this episode.
	/// </summary>
	[JsonIgnore]
	public User User { get; set; }

	/// <summary>
	/// The ID of the episode started.
	/// </summary>
	public Guid? EpisodeId { get; set; }

	/// <summary>
	/// The <see cref="Episode"/> started.
	/// </summary>
	[JsonIgnore]
	public Episode Episode { get; set; }

	/// <inheritdoc/>
	public DateTime AddedDate { get; set; }

	/// <summary>
	/// The date at which this item was played.
	/// </summary>
	public DateTime? PlayedDate { get; set; }

	/// <summary>
	/// Has the user started watching, is it planned?
	/// </summary>
	public WatchStatus Status { get; set; }

	/// <summary>
	/// Where the player has stopped watching the episode (in seconds).
	/// </summary>
	/// <remarks>
	/// Null if the status is not Watching.
	/// </remarks>
	public int? WatchedTime { get; set; }

	/// <summary>
	/// Where the player has stopped watching the episode (in percentage between 0 and 100).
	/// </summary>
	/// <remarks>
	/// Null if the status is not Watching or if the next episode is not started.
	/// </remarks>
	public int? WatchedPercent { get; set; }
}

[SqlFirstColumn(nameof(UserId))]
public class ShowWatchStatus : IAddedDate
{
	/// <summary>
	/// The ID of the user that started watching this episode.
	/// </summary>
	public Guid UserId { get; set; }

	/// <summary>
	/// The user that started watching this episode.
	/// </summary>
	[JsonIgnore]
	public User User { get; set; }

	/// <summary>
	/// The ID of the show started.
	/// </summary>
	public Guid ShowId { get; set; }

	/// <summary>
	/// The <see cref="Show"/> started.
	/// </summary>
	[JsonIgnore]
	public Show Show { get; set; }

	/// <inheritdoc/>
	public DateTime AddedDate { get; set; }

	/// <summary>
	/// The date at which this item was played.
	/// </summary>
	public DateTime? PlayedDate { get; set; }

	/// <summary>
	/// Has the user started watching, is it planned?
	/// </summary>
	public WatchStatus Status { get; set; }

	/// <summary>
	/// The number of episodes the user has not seen.
	/// </summary>
	public int UnseenEpisodesCount { get; set; }

	/// <summary>
	/// The ID of the episode started.
	/// </summary>
	public Guid? NextEpisodeId { get; set; }

	/// <summary>
	/// The next <see cref="Episode"/> to watch.
	/// </summary>
	public Episode? NextEpisode { get; set; }

	/// <summary>
	/// Where the player has stopped watching the episode (in seconds).
	/// </summary>
	/// <remarks>
	/// Null if the status is not Watching or if the next episode is not started.
	/// </remarks>
	public int? WatchedTime { get; set; }

	/// <summary>
	/// Where the player has stopped watching the episode (in percentage between 0 and 100).
	/// </summary>
	/// <remarks>
	/// Null if the status is not Watching or if the next episode is not started.
	/// </remarks>
	public int? WatchedPercent { get; set; }
}
