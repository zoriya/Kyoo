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
		/// Convert a <see cref="TvEpisode"/> into a <see cref="Episode"/>.
		/// </summary>
		/// <param name="episode">The episode to convert.</param>
		/// <param name="showID">The ID of the show inside TheMovieDb.</param>
		/// <param name="provider">The provider representing TheMovieDb.</param>
		/// <returns>The converted episode as a <see cref="Episode"/>.</returns>
		public static Episode ToEpisode(this TvEpisode episode, int showID, Provider provider)
		{
			return new Episode
			{
				SeasonNumber = episode.SeasonNumber,
				EpisodeNumber = episode.EpisodeNumber,
				Title = episode.Name,
				Overview = episode.Overview,
				ReleaseDate = episode.AirDate,
				Images = new Dictionary<int, string>
				{
					[Images.Thumbnail] = episode.StillPath != null 
						? $"https://image.tmdb.org/t/p/original{episode.StillPath}" 
						: null
				},
				ExternalIDs = new []
				{
					new MetadataID
					{
						Provider = provider,
						Link = $"https://www.themoviedb.org/tv/{showID}" +
							$"/season/{episode.SeasonNumber}/episode/{episode.EpisodeNumber}",
						DataID = episode.Id.ToString()
					}
				}
			};
		}
	}
}