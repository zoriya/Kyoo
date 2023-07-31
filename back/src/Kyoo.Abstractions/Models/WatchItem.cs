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
using System.ComponentModel;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A watch item give information useful for playback.
	/// Information about tracks and display information that could be used by the player.
	/// This contains mostly data from an <see cref="Episode"/> with another form.
	/// </summary>
	public class WatchItem : CustomTypeDescriptor, IThumbnails, ILink
	{
		/// <summary>
		/// The ID of the episode associated with this item.
		/// </summary>
		public int EpisodeID { get; set; }

		/// <summary>
		/// The slug of this episode.
		/// </summary>
		public string Slug { get; set; }

		/// <summary>
		/// The title of the show containing this episode.
		/// </summary>
		public string ShowTitle { get; set; }

		/// <summary>
		/// The slug of the show containing this episode
		/// </summary>
		public string ShowSlug { get; set; }

		/// <summary>
		/// The season in witch this episode is in.
		/// </summary>
		public int? SeasonNumber { get; set; }

		/// <summary>
		/// The number of this episode is it's season.
		/// </summary>
		public int? EpisodeNumber { get; set; }

		/// <summary>
		/// The absolute number of this episode. It's an episode number that is not reset to 1 after a new season.
		/// </summary>
		public int? AbsoluteNumber { get; set; }

		/// <summary>
		/// The title of this episode.
		/// </summary>
		public string Title { get; set; }

		/// <summary>
		/// The summary of this episode.
		/// </summary>
		public string Overview { get; set; }

		/// <summary>
		/// The release date of this episode. It can be null if unknown.
		/// </summary>
		public DateTime? ReleaseDate { get; set; }

		/// <summary>
		/// The episode that come before this one if you follow usual watch orders.
		/// If this is the first episode or this is a movie, it will be null.
		/// </summary>
		public Episode PreviousEpisode { get; set; }

		/// <summary>
		/// The episode that come after this one if you follow usual watch orders.
		/// If this is the last aired episode or this is a movie, it will be null.
		/// </summary>
		public Episode NextEpisode { get; set; }

		/// <summary>
		/// <c>true</c> if this is a movie, <c>false</c> otherwise.
		/// </summary>
		public bool IsMovie { get; set; }

		/// <inheritdoc />
		public Dictionary<int, string> Images { get; set; }

		/// <summary>
		/// The transcoder's info for this item. This include subtitles, fonts, chapters...
		/// </summary>
		public object Info { get; set; }

		[SerializeIgnore]
		private string _Type => IsMovie ? "movie" : "episode";

		/// <inheritdoc/>
		public object Link => new
		{
			Direct = $"/video/{_Type}/{Slug}/direct",
			Hls = $"/video/{_Type}/{Slug}/master.m3u8",
		};

		/// <summary>
		/// Create a <see cref="WatchItem"/> from an <see cref="Episode"/>.
		/// </summary>
		/// <param name="ep">The episode to transform.</param>
		/// <param name="library">
		/// A library manager to retrieve the next and previous episode and load the show and tracks of the episode.
		/// </param>
		/// <param name="client">A http client to reach the transcoder.</param>
		/// <returns>A new WatchItem representing the given episode.</returns>
		public static async Task<WatchItem> FromEpisode(Episode ep, ILibraryManager library, HttpClient client)
		{
			await library.Load(ep, x => x.Show);

			return new WatchItem
			{
				EpisodeID = ep.ID,
				Slug = ep.Slug,
				ShowSlug = ep.Show.Slug,
				ShowTitle = ep.Show.Title,
				SeasonNumber = ep.SeasonNumber,
				EpisodeNumber = ep.EpisodeNumber,
				AbsoluteNumber = ep.AbsoluteNumber,
				Title = ep.Title,
				Overview = ep.Overview,
				ReleaseDate = ep.ReleaseDate,
				Images = ep.Show.Images,
				PreviousEpisode = ep.Show.IsMovie
					? null
					: (await library.GetAll<Episode>(
							where: x => x.ShowID == ep.ShowID,
							limit: new Pagination(1, ep.ID, true)
						)).FirstOrDefault(),
				NextEpisode = ep.Show.IsMovie
					? null
					: (await library.GetAll<Episode>(
							where: x => x.ShowID == ep.ShowID,
							limit: new Pagination(1, ep.ID)
						)).FirstOrDefault(),
				IsMovie = ep.Show.IsMovie,
				Info = await _GetInfo(ep, client),
			};
		}

		private static async Task<object> _GetInfo(Episode ep, HttpClient client)
		{
			return await client.GetFromJsonAsync<object>(
				$"http://transcoder:7666/info/{(ep.Show.IsMovie ? "movie" : "episode")}/${ep.Slug}/info"
			);
		}

		/// <inheritdoc />
		public override string GetClassName()
		{
			return nameof(Show);
		}

		/// <inheritdoc />
		public override string GetComponentName()
		{
			return ShowSlug;
		}
	}
}
