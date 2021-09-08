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
using System.Linq;
using Kyoo.Abstractions.Models;
using Kyoo.Utils;
using TMDbLib.Objects.Search;
using TMDbLib.Objects.TvShows;

namespace Kyoo.TheMovieDb
{
	/// <summary>
	/// A class containing extensions methods to convert from TMDB's types to Kyoo's types.
	/// </summary>
	public static partial class Convertors
	{
		/// <summary>
		/// Convert a <see cref="TvShow"/> to a <see cref="Show"/>.
		/// </summary>
		/// <param name="tv">The show to convert.</param>
		/// <param name="provider">The provider representing TheMovieDb.</param>
		/// <returns>A converted <see cref="TvShow"/> as a <see cref="Show"/>.</returns>
		public static Show ToShow(this TvShow tv, Provider provider)
		{
			return new Show
			{
				Slug = Utility.ToSlug(tv.Name),
				Title = tv.Name,
				Aliases = tv.AlternativeTitles.Results.Select(x => x.Title).ToArray(),
				Overview = tv.Overview,
				Status = tv.Status == "Ended" ? Status.Finished : Status.Planned,
				StartAir = tv.FirstAirDate,
				EndAir = tv.LastAirDate,
				Images = new Dictionary<int, string>
				{
					[Images.Poster] = tv.PosterPath != null
						? $"https://image.tmdb.org/t/p/original{tv.PosterPath}"
						: null,
					[Images.Thumbnail] = tv.BackdropPath != null
						? $"https://image.tmdb.org/t/p/original{tv.BackdropPath}"
						: null,
					[Images.Trailer] = tv.Videos?.Results
						.Where(x => x.Type is "Trailer" or "Teaser" && x.Site == "YouTube")
						.Select(x => "https://www.youtube.com/watch?v=" + x.Key).FirstOrDefault()
				},
				Genres = tv.Genres.Select(x => new Genre(x.Name)).ToArray(),
				Studio = !string.IsNullOrEmpty(tv.ProductionCompanies.FirstOrDefault()?.Name)
					? new Studio(tv.ProductionCompanies.First().Name)
					: null,
				People = tv.Credits.Cast
					.Select(x => x.ToPeople(provider))
					.Concat(tv.Credits.Crew.Select(x => x.ToPeople(provider)))
					.ToArray(),
				ExternalIDs = new[]
				{
					new MetadataID
					{
						Provider = provider,
						Link = $"https://www.themoviedb.org/tv/{tv.Id}",
						DataID = tv.Id.ToString()
					}
				}
			};
		}

		/// <summary>
		/// Convert a <see cref="SearchTv"/> to a <see cref="Show"/>.
		/// </summary>
		/// <param name="tv">The show to convert.</param>
		/// <param name="provider">The provider representing TheMovieDb.</param>
		/// <returns>A converted <see cref="SearchTv"/> as a <see cref="Show"/>.</returns>
		public static Show ToShow(this SearchTv tv, Provider provider)
		{
			return new Show
			{
				Slug = Utility.ToSlug(tv.Name),
				Title = tv.Name,
				Overview = tv.Overview,
				StartAir = tv.FirstAirDate,
				Images = new Dictionary<int, string>
				{
					[Images.Poster] = tv.PosterPath != null
						? $"https://image.tmdb.org/t/p/original{tv.PosterPath}"
						: null,
					[Images.Thumbnail] = tv.BackdropPath != null
						? $"https://image.tmdb.org/t/p/original{tv.BackdropPath}"
						: null,
				},
				ExternalIDs = new[]
				{
					new MetadataID
					{
						Provider = provider,
						Link = $"https://www.themoviedb.org/tv/{tv.Id}",
						DataID = tv.Id.ToString()
					}
				}
			};
		}
	}
}
