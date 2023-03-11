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
using Kyoo.Utils;
using TMDbLib.Objects.Search;

namespace Kyoo.TheMovieDb
{
	/// <summary>
	/// A class containing extensions methods to convert from TMDB's types to Kyoo's types.
	/// </summary>
	public static partial class Convertors
	{
		/// <summary>
		/// Convert a <see cref="SearchCollection"/> into a <see cref="Collection"/>.
		/// </summary>
		/// <param name="collection">The collection to convert.</param>
		/// <param name="provider">The provider representing TheMovieDb.</param>
		/// <returns>The converted collection as a <see cref="Collection"/>.</returns>
		public static Collection ToCollection(this TMDbLib.Objects.Collections.Collection collection, Provider provider)
		{
			return new Collection
			{
				Slug = Utility.ToSlug(collection.Name),
				Name = collection.Name,
				Overview = collection.Overview,
				Images = new Dictionary<int, string>
				{
					[Images.Poster] = collection.PosterPath != null
						? $"https://image.tmdb.org/t/p/original{collection.PosterPath}"
						: null,
					[Images.Thumbnail] = collection.BackdropPath != null
						? $"https://image.tmdb.org/t/p/original{collection.BackdropPath}"
						: null
				},
				ExternalIDs = new[]
				{
					new MetadataID
					{
						Provider = provider,
						Link = $"https://www.themoviedb.org/collection/{collection.Id}",
						DataID = collection.Id.ToString()
					}
				}
			};
		}

		/// <summary>
		/// Convert a <see cref="SearchCollection"/> into a <see cref="Collection"/>.
		/// </summary>
		/// <param name="collection">The collection to convert.</param>
		/// <param name="provider">The provider representing TheMovieDb.</param>
		/// <returns>The converted collection as a <see cref="Collection"/>.</returns>
		public static Collection ToCollection(this SearchCollection collection, Provider provider)
		{
			return new Collection
			{
				Slug = Utility.ToSlug(collection.Name),
				Name = collection.Name,
				Images = new Dictionary<int, string>
				{
					[Images.Poster] = collection.PosterPath != null
						? $"https://image.tmdb.org/t/p/original{collection.PosterPath}"
						: null,
					[Images.Thumbnail] = collection.BackdropPath != null
						? $"https://image.tmdb.org/t/p/original{collection.BackdropPath}"
						: null
				},
				ExternalIDs = new[]
				{
					new MetadataID
					{
						Provider = provider,
						Link = $"https://www.themoviedb.org/collection/{collection.Id}",
						DataID = collection.Id.ToString()
					}
				}
			};
		}
	}
}
