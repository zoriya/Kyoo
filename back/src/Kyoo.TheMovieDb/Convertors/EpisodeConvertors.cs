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

using System.Collections.Generic;
using Kyoo.Abstractions.Models;
using TMDbLib.Objects.TvShows;

namespace Kyoo.TheMovieDb
{
	/// <summary>
	/// A class containing extensions methods to convert from TMDB's types to Kyoo's types.
	/// </summary>
	public static partial class Convertors
	{
		/// <summary>
		/// Convert a <see cref="TvEpisode"/> into a <see cref="Episode"/>.
		/// </summary>
		/// <param name="episode">The episode to convert.</param>
		/// <param name="showID">The ID of the show inside TheMovieDb.</param>
		/// <param name="provider">The provider representing TheMovieDb.</param>
		/// <returns>The converted episode as a <see cref="Episode"/>.</returns>
		public static Episode ToEpisode(this TvEpisode episode, int showID, Provider provider)
		{
			return new Episode
			{
				SeasonNumber = episode.SeasonNumber,
				EpisodeNumber = episode.EpisodeNumber,
				Title = episode.Name,
				Overview = episode.Overview,
				ReleaseDate = episode.AirDate,
				Images = new Dictionary<int, string>
				{
					[Images.Thumbnail] = episode.StillPath != null
						? $"https://image.tmdb.org/t/p/original{episode.StillPath}"
						: null
				},
				ExternalIDs = new[]
				{
					new MetadataID
					{
						Provider = provider,
						Link = $"https://www.themoviedb.org/tv/{showID}" +
							$"/season/{episode.SeasonNumber}/episode/{episode.EpisodeNumber}",
						DataID = episode.Id.ToString()
					}
				}
			};
		}
	}
}
