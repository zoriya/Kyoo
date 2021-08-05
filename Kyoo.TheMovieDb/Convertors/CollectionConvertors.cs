using System.Collections.Generic;
using Kyoo.Models;
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
				ExternalIDs = new []
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
				ExternalIDs = new []
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