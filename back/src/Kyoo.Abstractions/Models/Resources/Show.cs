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
using EntityFrameworkCore.Projectables;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Utils;
using Newtonsoft.Json;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A series or a movie.
	/// </summary>
	public class Show : IQuery, IResource, IMetadata, IOnMerge, IThumbnails, IAddedDate, ILibraryItem
	{
		public static Sort DefaultSort => new Sort<Show>.By(x => x.Name);

		/// <inheritdoc />
		public int Id { get; set; }

		/// <inheritdoc />
		[MaxLength(256)]
		public string Slug { get; set; }

		/// <summary>
		/// The title of this show.
		/// </summary>
		public string Name { get; set; }

		/// <summary>
		/// A catchphrase for this show.
		/// </summary>
		public string? Tagline { get; set; }

		/// <summary>
		/// The list of alternative titles of this show.
		/// </summary>
		public List<string> Aliases { get; set; } = new();

		/// <summary>
		/// The summary of this show.
		/// </summary>
		public string? Overview { get; set; }

		/// <summary>
		/// A list of tags that match this movie.
		/// </summary>
		public List<string> Tags { get; set; } = new();

		/// <summary>
		/// The list of genres (themes) this show has.
		/// </summary>
		public List<Genre> Genres { get; set; } = new();

		/// <summary>
		/// Is this show airing, not aired yet or finished?
		/// </summary>
		public Status Status { get; set; }

		/// <summary>
		/// How well this item is rated? (from 0 to 100).
		/// </summary>
		public int Rating { get; set; }

		/// <summary>
		/// The date this show started airing. It can be null if this is unknown.
		/// </summary>
		public DateTime? StartAir { get; set; }

		/// <summary>
		/// The date this show finished airing.
		/// It can also be null if this is unknown.
		/// </summary>
		public DateTime? EndAir { get; set; }

		/// <inheritdoc />
		public DateTime AddedDate { get; set; }

		/// <inheritdoc />
		public Image? Poster { get; set; }

		/// <inheritdoc />
		public Image? Thumbnail { get; set; }

		/// <inheritdoc />
		public Image? Logo { get; set; }

		/// <summary>
		/// A video of a few minutes that tease the content.
		/// </summary>
		public string? Trailer { get; set; }

		[SerializeIgnore]
		public DateTime? AirDate => StartAir;

		/// <inheritdoc />
		public Dictionary<string, MetadataId> ExternalId { get; set; } = new();

		/// <summary>
		/// The ID of the Studio that made this show.
		/// </summary>
		[SerializeIgnore] public int? StudioId { get; set; }

		/// <summary>
		/// The Studio that made this show.
		/// </summary>
		[LoadableRelation(nameof(StudioId))] public Studio? Studio { get; set; }

		/// <summary>
		/// The list of people that made this show.
		/// </summary>
		[SerializeIgnore] public ICollection<PeopleRole>? People { get; set; }

		/// <summary>
		/// The different seasons in this show. If this is a movie, this list is always null or empty.
		/// </summary>
		[SerializeIgnore] public ICollection<Season>? Seasons { get; set; }

		/// <summary>
		/// The list of episodes in this show.
		/// If this is a movie, there will be a unique episode (with the seasonNumber and episodeNumber set to null).
		/// Having an episode is necessary to store metadata and tracks.
		/// </summary>
		[SerializeIgnore] public ICollection<Episode>? Episodes { get; set; }

		/// <summary>
		/// The list of collections that contains this show.
		/// </summary>
		[SerializeIgnore] public ICollection<Collection>? Collections { get; set; }

		/// <summary>
		/// The first episode of this show.
		/// </summary>
		[Projectable(UseMemberBody = nameof(_FirstEpisode), OnlyOnInclude = true)]
		[LoadableRelation(
			// language=PostgreSQL
			Sql = """
				select
					"fe".*
				from (
					select
						e.*,
						row_number() over (partition by e.show_id order by e.absolute_number, e.season_number, e.episode_number) as number
					from
						episodes as e) as "fe"
				where
					"fe".number <= 1
			""",
			On = "show_id = \"this\".id"
		)]
		public Episode? FirstEpisode { get; set; }

		private Episode? _FirstEpisode => Episodes!
			.OrderBy(x => x.AbsoluteNumber)
			.ThenBy(x => x.SeasonNumber)
			.ThenBy(x => x.EpisodeNumber)
			.FirstOrDefault();

		/// <inheritdoc />
		public void OnMerge(object merged)
		{
			if (People != null)
			{
				foreach (PeopleRole link in People)
					link.Show = this;
			}

			if (Seasons != null)
			{
				foreach (Season season in Seasons)
					season.Show = this;
			}

			if (Episodes != null)
			{
				foreach (Episode episode in Episodes)
					episode.Show = this;
			}
		}

		public Show() { }

		[JsonConstructor]
		public Show(string name)
		{
			if (name != null)
			{
				Slug = Utility.ToSlug(name);
				Name = name;
			}
		}
	}

	/// <summary>
	/// The enum containing show's status.
	/// </summary>
	public enum Status
	{
		/// <summary>
		/// The status of the show is not known.
		/// </summary>
		Unknown,

		/// <summary>
		/// The show has finished airing.
		/// </summary>
		Finished,

		/// <summary>
		/// The show is still actively airing.
		/// </summary>
		Airing,

		/// <summary>
		/// This show has not aired yet but has been announced.
		/// </summary>
		Planned
	}
}
