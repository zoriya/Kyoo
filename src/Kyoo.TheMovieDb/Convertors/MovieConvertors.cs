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
using TMDbLib.Objects.Movies;
using TMDbLib.Objects.Search;

namespace Kyoo.TheMovieDb
{
	/// <summary>
	/// A class containing extensions methods to convert from TMDB's types to Kyoo's types.
	/// </summary>
	public static partial class Convertors
	{
		/// <summary>
		/// Convert a <see cref="Movie"/> into a <see cref="Show"/>.
		/// </summary>
		/// <param name="movie">The movie to convert.</param>
		/// <param name="provider">The provider representing TheMovieDb.</param>
		/// <returns>The converted movie as a <see cref="Show"/>.</returns>
		public static Show ToShow(this Movie movie, Provider provider)
		{
			return new Show
			{
				Slug = Utility.ToSlug(movie.Title),
				Title = movie.Title,
				Aliases = movie.AlternativeTitles.Titles.Select(x => x.Title).ToArray(),
				Overview = movie.Overview,
				Status = movie.Status == "Released" ? Status.Finished : Status.Planned,
				StartAir = movie.ReleaseDate,
				EndAir = movie.ReleaseDate,
				Images = new Dictionary<int, string>
				{
					[Images.Poster] = movie.PosterPath != null
						? $"https://image.tmdb.org/t/p/original{movie.PosterPath}"
						: null,
					[Images.Thumbnail] = movie.BackdropPath != null
						? $"https://image.tmdb.org/t/p/original{movie.BackdropPath}"
						: null,
					[Images.Trailer] = movie.Videos?.Results
						.Where(x => x.Type is "Trailer" or "Teaser" && x.Site == "YouTube")
						.Select(x => "https://www.youtube.com/watch?v=" + x.Key).FirstOrDefault(),
				},
				Genres = movie.Genres.Select(x => new Genre(x.Name)).ToArray(),
				Studio = !string.IsNullOrEmpty(movie.ProductionCompanies.FirstOrDefault()?.Name)
					? new Studio(movie.ProductionCompanies.First().Name)
					: null,
				IsMovie = true,
				People = movie.Credits.Cast
					.Select(x => x.ToPeople(provider))
					.Concat(movie.Credits.Crew.Select(x => x.ToPeople(provider)))
					.ToArray(),
				ExternalIDs = new[]
				{
					new MetadataID
					{
						Provider = provider,
						Link = $"https://www.themoviedb.org/movie/{movie.Id}",
						DataID = movie.Id.ToString()
					}
				}
			};
		}

		/// <summary>
		/// Convert a <see cref="SearchMovie"/> into a <see cref="Show"/>.
		/// </summary>
		/// <param name="movie">The movie to convert.</param>
		/// <param name="provider">The provider representing TheMovieDb.</param>
		/// <returns>The converted movie as a <see cref="Show"/>.</returns>
		public static Show ToShow(this SearchMovie movie, Provider provider)
		{
			return new Show
			{
				Slug = Utility.ToSlug(movie.Title),
				Title = movie.Title,
				Overview = movie.Overview,
				StartAir = movie.ReleaseDate,
				EndAir = movie.ReleaseDate,
				Images = new Dictionary<int, string>
				{
					[Images.Poster] = movie.PosterPath != null
						? $"https://image.tmdb.org/t/p/original{movie.PosterPath}"
						: null,
					[Images.Thumbnail] = movie.BackdropPath != null
						? $"https://image.tmdb.org/t/p/original{movie.BackdropPath}"
						: null,
				},
				IsMovie = true,
				ExternalIDs = new[]
				{
					new MetadataID
					{
						Provider = provider,
						Link = $"https://www.themoviedb.org/movie/{movie.Id}",
						DataID = movie.Id.ToString()
					}
				}
			};
		}
	}
}
