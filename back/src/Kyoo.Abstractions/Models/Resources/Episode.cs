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
using System.Linq;
using System.Text.RegularExpressions;
using EntityFrameworkCore.Projectables;
using JetBrains.Annotations;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A class to represent a single show's episode.
	/// </summary>
	public class Episode : IQuery, IResource, IMetadata, IThumbnails, IAddedDate, INews
	{
		// Use absolute numbers by default and fallback to season/episodes if it does not exists.
		public static Sort DefaultSort => new Sort<Episode>.Conglomerate(
			new Sort<Episode>.By(x => x.AbsoluteNumber),
			new Sort<Episode>.By(x => x.SeasonNumber),
			new Sort<Episode>.By(x => x.EpisodeNumber)
		);

		/// <inheritdoc />
		public Guid Id { get; set; }

		/// <inheritdoc />
		[Computed]
		[MaxLength(256)]
		public string Slug
		{
			get
			{
				if (ShowSlug != null || Show?.Slug != null)
					return GetSlug(ShowSlug ?? Show!.Slug, SeasonNumber, EpisodeNumber, AbsoluteNumber);
				return GetSlug(ShowId.ToString(), SeasonNumber, EpisodeNumber, AbsoluteNumber);
			}

			[UsedImplicitly]
			private set
			{
				Match match = Regex.Match(value, @"(?<show>.+)-s(?<season>\d+)e(?<episode>\d+)");

				if (match.Success)
				{
					ShowSlug = match.Groups["show"].Value;
					SeasonNumber = int.Parse(match.Groups["season"].Value);
					EpisodeNumber = int.Parse(match.Groups["episode"].Value);
				}
				else
				{
					match = Regex.Match(value, @"(?<show>.+)-(?<absolute>\d+)");
					if (match.Success)
					{
						ShowSlug = match.Groups["show"].Value;
						AbsoluteNumber = int.Parse(match.Groups["absolute"].Value);
					}
					else
						ShowSlug = value;
					SeasonNumber = null;
					EpisodeNumber = null;
				}
			}
		}

		/// <summary>
		/// The slug of the Show that contain this episode. If this is not set, this episode is ill-formed.
		/// </summary>
		[SerializeIgnore] public string? ShowSlug { private get; set; }

		/// <summary>
		/// The ID of the Show containing this episode.
		/// </summary>
		public Guid ShowId { get; set; }

		/// <summary>
		/// The show that contains this episode.
		/// </summary>
		[LoadableRelation(nameof(ShowId))] public Show? Show { get; set; }

		/// <summary>
		/// The ID of the Season containing this episode.
		/// </summary>
		public Guid? SeasonId { get; set; }

		/// <summary>
		/// The season that contains this episode.
		/// </summary>
		/// <remarks>
		/// This can be null if the season is unknown and the episode is only identified
		/// by it's <see cref="AbsoluteNumber"/>.
		/// </remarks>
		[LoadableRelation(nameof(SeasonId))] public Season? Season { get; set; }

		/// <summary>
		/// The season in witch this episode is in.
		/// </summary>
		public int? SeasonNumber { get; set; }

		/// <summary>
		/// The number of this episode in it's season.
		/// </summary>
		public int? EpisodeNumber { get; set; }

		/// <summary>
		/// The absolute number of this episode. It's an episode number that is not reset to 1 after a new season.
		/// </summary>
		public int? AbsoluteNumber { get; set; }

		/// <summary>
		/// The path of the video file for this episode.
		/// </summary>
		public string Path { get; set; }

		/// <summary>
		/// The title of this episode.
		/// </summary>
		public string? Name { get; set; }

		/// <summary>
		/// The overview of this episode.
		/// </summary>
		public string? Overview { get; set; }

		/// <summary>
		/// How long is this episode? (in minutes)
		/// </summary>
		public int Runtime { get; set; }

		/// <summary>
		/// The release date of this episode. It can be null if unknown.
		/// </summary>
		public DateTime? ReleaseDate { get; set; }

		/// <inheritdoc />
		public DateTime AddedDate { get; set; }

		/// <inheritdoc />
		public Image? Poster { get; set; }

		/// <inheritdoc />
		public Image? Thumbnail { get; set; }

		/// <inheritdoc />
		public Image? Logo { get; set; }

		/// <inheritdoc />
		public Dictionary<string, MetadataId> ExternalId { get; set; } = new();

		/// <summary>
		/// The previous episode that should be seen before viewing this one.
		/// </summary>
		[Projectable(UseMemberBody = nameof(_PreviousEpisode), OnlyOnInclude = true)]
		[LoadableRelation(
			// language=PostgreSQL
			Sql = """
				select
					pe.* -- Episode as pe
				from
					episodes as "pe"
				where
					pe.show_id = "this".show_id
					and (pe.absolute_number < "this".absolute_number
						or pe.season_number < "this".season_number
						or (pe.season_number = "this".season_number
							and e.episode_number < "this".episode_number))
				order by
					pe.absolute_number desc,
					pe.season_number desc,
					pe.episode_number desc
				limit 1
			"""
		)]
		public Episode? PreviousEpisode { get; set; }

		private Episode? _PreviousEpisode => Show!.Episodes!
			.OrderByDescending(x => x.AbsoluteNumber)
			.ThenByDescending(x => x.SeasonNumber)
			.ThenByDescending(x => x.EpisodeNumber)
			.FirstOrDefault(x =>
				x.AbsoluteNumber < AbsoluteNumber
				|| x.SeasonNumber < SeasonNumber
				|| (x.SeasonNumber == SeasonNumber && x.EpisodeNumber < EpisodeNumber)
			);

		/// <summary>
		/// The next episode to watch after this one.
		/// </summary>
		[Projectable(UseMemberBody = nameof(_NextEpisode), OnlyOnInclude = true)]
		[LoadableRelation(
			// language=PostgreSQL
			Sql = """
				select
					ne.* -- Episode as ne
				from
					episodes as "ne"
				where
					ne.show_id = "this".show_id
					and (ne.absolute_number > "this".absolute_number
						or ne.season_number > "this".season_number
						or (ne.season_number = "this".season_number
							and e.episode_number > "this".episode_number))
				order by
					ne.absolute_number,
					ne.season_number,
					ne.episode_number
				limit 1
			"""
		)]
		public Episode? NextEpisode { get; set; }

		private Episode? _NextEpisode => Show!.Episodes!
			.OrderBy(x => x.AbsoluteNumber)
			.ThenBy(x => x.SeasonNumber)
			.ThenBy(x => x.EpisodeNumber)
			.FirstOrDefault(x =>
				x.AbsoluteNumber > AbsoluteNumber
				|| x.SeasonNumber > SeasonNumber
				|| (x.SeasonNumber == SeasonNumber && x.EpisodeNumber > EpisodeNumber)
			);

		[SerializeIgnore] public ICollection<EpisodeWatchStatus> Watched { get; set; }

		/// <summary>
		/// Metadata of what an user as started/planned to watch.
		/// </summary>
		[Projectable(UseMemberBody = nameof(_WatchStatus), OnlyOnInclude = true)]
		[LoadableRelation] public EpisodeWatchStatus? WatchStatus { get; set; }

		// There is a global query filter to filter by user so we just need to do single.
		private EpisodeWatchStatus? _WatchStatus => Watched.FirstOrDefault();

		/// <summary>
		/// Links to watch this episode.
		/// </summary>
		public VideoLinks Links => new()
		{
			Direct = $"/video/episode/{Slug}/direct",
			Hls = $"/video/episode/{Slug}/master.m3u8",
		};

		/// <summary>
		/// Get the slug of an episode.
		/// </summary>
		/// <param name="showSlug">The slug of the show. It can't be null.</param>
		/// <param name="seasonNumber">
		/// The season in which the episode is.
		/// If this is a movie or if the episode should be referred by it's absolute number, set this to null.
		/// </param>
		/// <param name="episodeNumber">
		/// The number of the episode in it's season.
		/// If this is a movie or if the episode should be referred by it's absolute number, set this to null.
		/// </param>
		/// <param name="absoluteNumber">
		/// The absolute number of this show.
		/// If you don't know it or this is a movie, use null
		/// </param>
		/// <returns>The slug corresponding to the given arguments</returns>
		public static string GetSlug(string showSlug,
			int? seasonNumber,
			int? episodeNumber,
			int? absoluteNumber = null)
		{
			return seasonNumber switch
			{
				null when absoluteNumber == null => showSlug,
				null => $"{showSlug}-{absoluteNumber}",
				_ => $"{showSlug}-s{seasonNumber}e{episodeNumber}"
			};
		}
	}
}
