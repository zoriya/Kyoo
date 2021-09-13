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
		/// Convert a <see cref="TvSeason"/> into a <see cref="Season"/>.
		/// </summary>
		/// <param name="season">The season to convert.</param>
		/// <param name="showID">The ID of the show inside TheMovieDb.</param>
		/// <param name="provider">The provider representing TheMovieDb.</param>
		/// <returns>The converted season as a <see cref="Season"/>.</returns>
		public static Season ToSeason(this TvSeason season, int showID, Provider provider)
		{
			return new Season
			{
				SeasonNumber = season.SeasonNumber,
				Title = season.Name,
				Overview = season.Overview,
				StartDate = season.AirDate,
				Images = new Dictionary<int, string>
				{
					[Images.Poster] = season.PosterPath != null
						? $"https://image.tmdb.org/t/p/original{season.PosterPath}"
						: null
				},
				ExternalIDs = new[]
				{
					new MetadataID
					{
						Provider = provider,
						Link = $"https://www.themoviedb.org/tv/{showID}/season/{season.SeasonNumber}",
						DataID = season.Id?.ToString()
					}
				}
			};
		}
	}
}
