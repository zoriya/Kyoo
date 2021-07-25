using System.Linq;
using Kyoo.Models;
using TMDbLib.Objects.General;
using TMDbLib.Objects.Movies;
using TMDbLib.Objects.Search;
using TMDbLib.Objects.TvShows;
using Genre = Kyoo.Models.Genre;
using TvCast = TMDbLib.Objects.TvShows.Cast;
using MovieCast = TMDbLib.Objects.Movies.Cast;

namespace Kyoo.TheMovieDb
{
	public static class Convertors
	{
		/// <summary>
		/// Convert a <see cref="Movie"/> into a <see cref="Show"/>.
		/// </summary>
		/// <param name="movie">The movie to convert.</param>
		/// <param name="provider">The provider representing TheMovieDb.</param>
		/// <returns>The converted movie as a <see cref="Show"/>.</returns>
		public static Show ToShow(this Movie movie, Provider provider)
		{
			return new()
			{
				Slug = Utility.ToSlug(movie.Title),
				Title = movie.Title,
				Aliases = movie.AlternativeTitles.Titles.Select(x => x.Title).ToArray(),
				Overview = movie.Overview,
				TrailerUrl = movie.Videos?.Results.Where(x => x.Type is "Trailer" or "Teaser" && x.Site == "YouTube")
					.Select(x => "https://www.youtube.com/watch?v=" + x.Key).FirstOrDefault(),
				Status = movie.Status == "Released" ? Status.Finished : Status.Planned,
				StartAir = movie.ReleaseDate,
				EndAir = movie.ReleaseDate,
				Poster = movie.PosterPath != null
					? $"https://image.tmdb.org/t/p/original{movie.PosterPath}"
					: null,
				Backdrop = movie.BackdropPath != null
					? $"https://image.tmdb.org/t/p/original{movie.BackdropPath}"
					: null,
				Genres = movie.Genres.Select(x => new Genre(x.Name)).ToArray(),
				Studio = !string.IsNullOrEmpty(movie.ProductionCompanies.FirstOrDefault()?.Name)
					? new Studio(movie.ProductionCompanies.First().Name)
					: null,
				IsMovie = true,
				People = movie.Credits.Cast
					.Select(x => x.ToPeople(provider))
					.Concat(movie.Credits.Crew.Select(x => x.ToPeople(provider)))
					.ToArray(),
				ExternalIDs = new []
				{
					new MetadataID<Show>
					{
						Second = provider,
						Link = $"https://www.themoviedb.org/movie/{movie.Id}",
						DataID = movie.Id.ToString()
					}
				}
			};
		}
		
		/// <summary>
		/// Convert a <see cref="TvShow"/> to a <see cref="Show"/>.
		/// </summary>
		/// <param name="tv">The show to convert.</param>
		/// <param name="provider">The provider representing TheMovieDb.</param>
		/// <returns>A converted <see cref="TvShow"/> as a <see cref="Show"/>.</returns>
		public static Show ToShow(this TvShow tv, Provider provider)
		{
			return new()
			{
				Slug = Utility.ToSlug(tv.Name),
				Title = tv.Name,
				Aliases = tv.AlternativeTitles.Results.Select(x => x.Title).ToArray(),
				Overview = tv.Overview,
				TrailerUrl = tv.Videos?.Results.Where(x => x.Type is "Trailer" or "Teaser" && x.Site == "YouTube")
					.Select(x => "https://www.youtube.com/watch?v=" + x.Key).FirstOrDefault(),
				Status = tv.Status == "Ended" ? Status.Finished : Status.Planned,
				StartAir = tv.FirstAirDate,
				EndAir = tv.LastAirDate,
				Poster = tv.PosterPath != null
					? $"https://image.tmdb.org/t/p/original{tv.PosterPath}"
					: null,
				Backdrop = tv.BackdropPath != null
					? $"https://image.tmdb.org/t/p/original{tv.BackdropPath}"
					: null,
				Genres = tv.Genres.Select(x => new Genre(x.Name)).ToArray(),
				Studio = !string.IsNullOrEmpty(tv.ProductionCompanies.FirstOrDefault()?.Name)
					? new Studio(tv.ProductionCompanies.First().Name)
					: null,
				IsMovie = true,
				People = tv.Credits.Cast
					.Select(x => x.ToPeople(provider))
					.Concat(tv.Credits.Crew.Select(x => x.ToPeople(provider)))
					.ToArray(),
				ExternalIDs = new []
				{
					new MetadataID<Show>
					{
						Second = provider,
						Link = $"https://www.themoviedb.org/movie/{tv.Id}",
						DataID = tv.Id.ToString()
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
			return new()
			{
				Slug = Utility.ToSlug(movie.Title),
				Title = movie.Title,
				Overview = movie.Overview,
				StartAir = movie.ReleaseDate,
				EndAir = movie.ReleaseDate,
				Poster = movie.PosterPath != null
					? $"https://image.tmdb.org/t/p/original{movie.PosterPath}"
					: null,
				Backdrop = movie.BackdropPath != null
					? $"https://image.tmdb.org/t/p/original{movie.BackdropPath}"
					: null,
				IsMovie = true,
				ExternalIDs = new []
				{
					new MetadataID<Show>
					{
						Second = provider,
						Link = $"https://www.themoviedb.org/movie/{movie.Id}",
						DataID = movie.Id.ToString()
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
			return new()
			{
				Slug = Utility.ToSlug(tv.Name),
				Title = tv.Name,
				Overview = tv.Overview,
				StartAir = tv.FirstAirDate,
				Poster = tv.PosterPath != null
					? $"https://image.tmdb.org/t/p/original{tv.PosterPath}"
					: null,
				Backdrop = tv.BackdropPath != null
					? $"https://image.tmdb.org/t/p/original{tv.BackdropPath}"
					: null,
				IsMovie = true,
				ExternalIDs = new []
				{
					new MetadataID<Show>
					{
						Second = provider,
						Link = $"https://www.themoviedb.org/movie/{tv.Id}",
						DataID = tv.Id.ToString()
					}
				}
			};
		}

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
					Poster = cast.ProfilePath != null ? $"https://image.tmdb.org/t/p/original{cast.ProfilePath}" : null,
					ExternalIDs = new[]
					{
						new MetadataID<People>
						{
							Second = provider,
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
					Poster = cast.ProfilePath != null ? $"https://image.tmdb.org/t/p/original{cast.ProfilePath}" : null,
					ExternalIDs = new[]
					{
						new MetadataID<People>
						{
							Second = provider,
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
					Poster = crew.ProfilePath != null ? $"https://image.tmdb.org/t/p/original{crew.ProfilePath}" : null,
					ExternalIDs = new[]
					{
						new MetadataID<People>
						{
							Second = provider,
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