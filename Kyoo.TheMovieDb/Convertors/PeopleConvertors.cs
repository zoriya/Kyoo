using System.Collections.Generic;
using Kyoo.Abstractions.Models;
using Kyoo.Utils;
using TMDbLib.Objects.General;
using TMDbLib.Objects.People;
using TMDbLib.Objects.Search;
using Images = Kyoo.Abstractions.Models.Images;
using MovieCast = TMDbLib.Objects.Movies.Cast;
using TvCast = TMDbLib.Objects.TvShows.Cast;

namespace Kyoo.TheMovieDb
{
	/// <summary>
	/// A class containing extensions methods to convert from TMDB's types to Kyoo's types.
	/// </summary>
	public static partial class Convertors
	{
		/// <summary>
		/// Convert a <see cref="MovieCast"/> to a <see cref="Abstractions.Models.PeopleRole"/>.
		/// </summary>
		/// <param name="cast">An internal TheMovieDB cast.</param>
		/// <param name="provider">The provider that represent TheMovieDB inside Kyoo.</param>
		/// <returns>A <see cref="Abstractions.Models.PeopleRole"/> representing the movie cast.</returns>
		public static PeopleRole ToPeople(this MovieCast cast, Provider provider)
		{
			return new PeopleRole
			{
				People = new People
				{
					Slug = Utility.ToSlug(cast.Name),
					Name = cast.Name,
					Images = new Dictionary<int, string>
					{
						[Images.Poster] = cast.ProfilePath != null
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
			return new PeopleRole
			{
				People = new People
				{
					Slug = Utility.ToSlug(cast.Name),
					Name = cast.Name,
					Images = new Dictionary<int, string>
					{
						[Images.Poster] = cast.ProfilePath != null
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
			return new PeopleRole
			{
				People = new People
				{
					Slug = Utility.ToSlug(crew.Name),
					Name = crew.Name,
					Images = new Dictionary<int, string>
					{
						[Images.Poster] = crew.ProfilePath != null
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

		/// <summary>
		/// Convert a <see cref="Person"/> to a <see cref="People"/>.
		/// </summary>
		/// <param name="person">An internal TheMovieDB person.</param>
		/// <param name="provider">The provider that represent TheMovieDB inside Kyoo.</param>
		/// <returns>A <see cref="People"/> representing the person.</returns>
		public static People ToPeople(this Person person, Provider provider)
		{
			return new People
			{
				Slug = Utility.ToSlug(person.Name),
				Name = person.Name,
				Images = new Dictionary<int, string>
				{
					[Images.Poster] = person.ProfilePath != null
						? $"https://image.tmdb.org/t/p/original{person.ProfilePath}"
						: null
				},
				ExternalIDs = new[]
				{
					new MetadataID
					{
						Provider = provider,
						DataID = person.Id.ToString(),
						Link = $"https://www.themoviedb.org/person/{person.Id}"
					}
				}
			};
		}

		/// <summary>
		/// Convert a <see cref="SearchPerson"/> to a <see cref="People"/>.
		/// </summary>
		/// <param name="person">An internal TheMovieDB person.</param>
		/// <param name="provider">The provider that represent TheMovieDB inside Kyoo.</param>
		/// <returns>A <see cref="People"/> representing the person.</returns>
		public static People ToPeople(this SearchPerson person, Provider provider)
		{
			return new People
			{
				Slug = Utility.ToSlug(person.Name),
				Name = person.Name,
				Images = new Dictionary<int, string>
				{
					[Images.Poster] = person.ProfilePath != null
						? $"https://image.tmdb.org/t/p/original{person.ProfilePath}"
						: null
				},
				ExternalIDs = new[]
				{
					new MetadataID
					{
						Provider = provider,
						DataID = person.Id.ToString(),
						Link = $"https://www.themoviedb.org/person/{person.Id}"
					}
				}
			};
		}
	}
}
