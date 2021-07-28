using System.Collections.Generic;
using Kyoo.Models;
using TMDbLib.Objects.General;
using TvCast = TMDbLib.Objects.TvShows.Cast;
using MovieCast = TMDbLib.Objects.Movies.Cast;

namespace Kyoo.TheMovieDb
{
	/// <summary>
	/// A class containing extensions methods to convert from TMDB's types to Kyoo's types.
	/// </summary>
	public static partial class Convertors
	{
		/// <summary>
		/// Convert a <see cref="MovieCast"/> to a <see cref="PeopleRole"/>.
		/// </summary>
		/// <param name="cast">An internal TheMovieDB cast.</param>
		/// <param name="provider">The provider that represent TheMovieDB inside Kyoo.</param>
		/// <returns>A <see cref="PeopleRole"/> representing the movie cast.</returns>
		public static PeopleRole ToPeople(this MovieCast cast, Provider provider)
		{
			return new()
			{
				People = new People
				{
					Slug = Utility.ToSlug(cast.Name),
					Name = cast.Name,
					Images = new Dictionary<int, string>
					{
						[Thumbnails.Poster] = cast.ProfilePath != null 
							? $"https://image.tmdb.org/t/p/original{cast.ProfilePath}" 
							: null
					},
					ExternalIDs = new[]
					{
						new MetadataID
						{
							Provider = provider,
							DataID = cast.Id.ToString(),
							Link = $"https://www.themoviedb.org/person/{cast.Id}"
						}
					}
				},
				Type = "Actor",
				Role = cast.Character
			};
		}
		
		/// <summary>
		/// Convert a <see cref="TvCast"/> to a <see cref="PeopleRole"/>.
		/// </summary>
		/// <param name="cast">An internal TheMovieDB cast.</param>
		/// <param name="provider">The provider that represent TheMovieDB inside Kyoo.</param>
		/// <returns>A <see cref="PeopleRole"/> representing the movie cast.</returns>
		public static PeopleRole ToPeople(this TvCast cast, Provider provider)
		{
			return new()
			{
				People = new People
				{
					Slug = Utility.ToSlug(cast.Name),
					Name = cast.Name,
					Images = new Dictionary<int, string>
					{
						[Thumbnails.Poster] = cast.ProfilePath != null 
							? $"https://image.tmdb.org/t/p/original{cast.ProfilePath}" 
							: null
					},
					ExternalIDs = new[]
					{
						new MetadataID
						{
							Provider = provider,
							DataID = cast.Id.ToString(),
							Link = $"https://www.themoviedb.org/person/{cast.Id}"
						}
					}
				},
				Type = "Actor",
				Role = cast.Character
			};
		}
		
		/// <summary>
		/// Convert a <see cref="Crew"/> to a <see cref="PeopleRole"/>.
		/// </summary>
		/// <param name="crew">An internal TheMovieDB crew member.</param>
		/// <param name="provider">The provider that represent TheMovieDB inside Kyoo.</param>
		/// <returns>A <see cref="PeopleRole"/> representing the movie crew.</returns>
		public static PeopleRole ToPeople(this Crew crew, Provider provider)
		{
			return new()
			{
				People = new People
				{
					Slug = Utility.ToSlug(crew.Name),
					Name = crew.Name,
					Images = new Dictionary<int, string>
					{
						[Thumbnails.Poster] = crew.ProfilePath != null 
							? $"https://image.tmdb.org/t/p/original{crew.ProfilePath}" 
							: null
					},
					ExternalIDs = new[]
					{
						new MetadataID
						{
							Provider = provider,
							DataID = crew.Id.ToString(),
							Link = $"https://www.themoviedb.org/person/{crew.Id}"
						}
					}
				},
				Type = crew.Department,
				Role = crew.Job
			};
		}
	}
}