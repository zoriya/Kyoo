using System;
using System.Globalization;
using System.Linq;
using Kyoo.Models;
using TvDbSharper.Dto;

namespace Kyoo.TheTvdb
{
	/// <summary>
	/// A set of extensions methods used to convert tvdb models to Kyoo models.
	/// </summary>
	public static class Convertors
	{
		/// <summary>
		/// Convert the string representation of the status in the tvdb API to a Kyoo's <see cref="Status"/> enum. 
		/// </summary>
		/// <param name="status">The string representing the status.</param>
		/// <returns>A kyoo <see cref="Status"/> value or null.</returns>
		private static Status? GetStatus(string status)
		{
			return status switch
			{
				"Ended" => Status.Finished,
				"Continuing" => Status.Airing,
				_ => null
			};
		}

		/// <summary>
		/// Parse a TVDB date and return a <see cref="DateTime"/> or null if the string is invalid.
		/// </summary>
		/// <param name="date">The date string to parse</param>
		/// <returns>The parsed <see cref="DateTime"/> or null.</returns>
		private static DateTime ParseDate(string date)
		{
			DateTime.TryParseExact(date, "yyyy-mm-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsed);
			return parsed;
		}
		
		/// <summary>
		/// Convert a series search to a show. 
		/// </summary>
		/// <param name="result">The search result</param>
		/// <param name="provider">The provider representing the tvdb inside kyoo</param>
		/// <returns>A show representing the given search result.</returns>
		public static Show ToShow(this SeriesSearchResult result, Provider provider)
		{
			return new()
			{
				Slug = result.Slug,
				Title = result.SeriesName,
				Aliases = result.Aliases,
				Overview = result.Overview,
				Status = GetStatus(result.Status),
				StartAir = ParseDate(result.FirstAired),
				Poster = result.Poster != null ? $"https://www.thetvdb.com{result.Poster}" : null,
				ExternalIDs = new[]
				{
					new MetadataID<Show>
					{
						DataID = result.Id.ToString(),
						Link = $"https://www.thetvdb.com/series/{result.Slug}",
						Second = provider
					}
				}
			};
		}
	
		/// <summary>
		/// Convert a tvdb series to a kyoo show.
		/// </summary>
		/// <param name="series">The series to convert</param>
		/// <param name="provider">The provider representing the tvdb inside kyoo</param>
		/// <returns>A show representing the given series.</returns>
		public static Show ToShow(this Series series, Provider provider)
		{
			return new()
			{
				Slug = series.Slug,
				Title = series.SeriesName,
				Aliases = series.Aliases,
				Overview = series.Overview,
				Status = GetStatus(series.Status),
				StartAir = ParseDate(series.FirstAired),
				Poster = series.Poster != null ? $"https://www.thetvdb.com/banners/{series.Poster}" : null,
				Backdrop = series.FanArt != null ? $"https://www.thetvdb.com/banners/{series.FanArt}" : null,
				Genres = series.Genre.Select(y => new Genre(y)).ToList(),
				ExternalIDs = new[]
				{
					new MetadataID<Show>
					{
						DataID = series.Id.ToString(),
						Link = $"https://www.thetvdb.com/series/{series.Slug}",
						Second = provider
					}
				}
			};
		}
	
		/// <summary>
		/// Convert a tvdb actor to a kyoo <see cref="PeopleRole"/>.
		/// </summary>
		/// <param name="actor">The actor to convert</param>
		/// <param name="provider">The provider representing the tvdb inside kyoo</param>
		/// <returns>A people role representing the given actor in the role they played.</returns>
		public static PeopleRole ToPeopleRole(this Actor actor, Provider provider)
		{
			return new()
			{
				People = new People
				{
					Slug = Utility.ToSlug(actor.Name),
					Name = actor.Name,
					Poster = actor.Image != null ? $"https://www.thetvdb.com/banners/{actor.Image}" : null,
					ExternalIDs = new []
					{
						new MetadataID<People>()
						{
							DataID = actor.Id.ToString(),
							Link = $"https://www.thetvdb.com/people/{actor.Id}",
							Second = provider
						}
					}
				},
				Role = actor.Role
			};
		}

		/// <summary>
		/// Convert a tvdb episode to a kyoo <see cref="Episode"/>.
		/// </summary>
		/// <param name="episode">The episode to convert</param>
		/// <param name="provider">The provider representing the tvdb inside kyoo</param>
		/// <returns>A episode representing the given tvdb episode.</returns>
		public static Episode ToEpisode(this EpisodeRecord episode, Provider provider)
		{
			return new()
			{
				SeasonNumber = episode.AiredSeason,
				EpisodeNumber = episode.AiredEpisodeNumber,
				AbsoluteNumber = episode.AbsoluteNumber,
				Title = episode.EpisodeName,
				Overview = episode.Overview,
				Thumb = episode.Filename != null ? $"https://www.thetvdb.com/banners/{episode.Filename}" : null,
				ExternalIDs = new[]
				{
					new MetadataID<Episode>
					{
						DataID = episode.Id.ToString(),
						Link = $"https://www.thetvdb.com/series/{episode.SeriesId}/episodes/{episode.Id}",
						Second = provider
					}
				}
			};
		}
	}
}