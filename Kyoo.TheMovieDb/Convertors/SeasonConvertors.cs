using System.Collections.Generic;
using Kyoo.Models;
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
				ExternalIDs = new []
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