using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Kyoo.TheMovieDb.Models;
using Microsoft.Extensions.Options;
using TMDbLib.Client;
using TMDbLib.Objects.Movies;
using TMDbLib.Objects.Search;
using TMDbLib.Objects.TvShows;

namespace Kyoo.TheMovieDb
{
	/// <summary>
	/// A metadata provider for TheMovieDb.
	/// </summary>
	public class TheMovieDbProvider : IMetadataProvider
	{
		/// <summary>
		/// The API key used to authenticate with TheMovieDb API.
		/// </summary>
		private readonly IOptions<TheMovieDbOptions> _apiKey;
		
		/// <inheritdoc />
		public Provider Provider => new()
		{
			Slug = "the-moviedb",
			Name = "TheMovieDB",
			LogoExtension = "svg",
			Logo = "https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
		};
		
		/// <summary>
		/// Create a new <see cref="TheMovieDbProvider"/> using the given api key.
		/// </summary>
		/// <param name="apiKey">The api key</param>
		public TheMovieDbProvider(IOptions<TheMovieDbOptions> apiKey)
		{
			_apiKey = apiKey;
		}
		

		/// <inheritdoc />
		public Task<T> Get<T>(T item) 
			where T : class, IResource
		{
			return item switch
			{
				Show show => _GetShow(show) as Task<T>,
				_ => null
			};
		}
		
		/// <summary>
		/// Get a show using it's id, if the id is not present in the show, fallback to a title search.
		/// </summary>
		/// <param name="show">The show to search for</param>
		/// <returns>A show containing metadata from TheMovieDb</returns>
		private async Task<Show> _GetShow(Show show)
		{
			if (!int.TryParse(show.GetID(Provider.Name), out int id))
				return (await _SearchShows(show.Title ?? show.Slug)).FirstOrDefault();
			TMDbClient client = new(_apiKey.Value.ApiKey);
			
			if (show.IsMovie)
			{
				return (await client
					.GetMovieAsync(id, MovieMethods.AlternativeTitles | MovieMethods.Videos | MovieMethods.Credits))
					?.ToShow(Provider);
			}
			
			return (await client
				.GetTvShowAsync(id, TvShowMethods.AlternativeTitles | TvShowMethods.Videos | TvShowMethods.Credits))
				?.ToShow(Provider);
		}
		
		
		/// <inheritdoc />
		public async Task<ICollection<T>> Search<T>(string query) 
			where T : class, IResource
		{
			if (typeof(T) == typeof(Collection))
				return (await _SearchCollections(query) as ICollection<T>)!;
			if (typeof(T) == typeof(Show))
				return (await _SearchShows(query) as ICollection<T>)!;
			return ArraySegment<T>.Empty;
		}

		/// <summary>
		/// Search for a collection using it's name as a query.
		/// </summary>
		/// <param name="query">The query to search for</param>
		/// <returns>A collection containing metadata from TheMovieDb</returns>
		private async Task<ICollection<Collection>> _SearchCollections(string query)
		{
			TMDbClient client = new(_apiKey.Value.ApiKey);
			return (await client.SearchCollectionAsync(query))
				.Results
				.Select(x => x.ToCollection(Provider))
				.ToArray();
		}

		/// <summary>
		/// Search for a show using it's name as a query.
		/// </summary>
		/// <param name="query">The query to search for</param>
		/// <returns>A show containing metadata from TheMovieDb</returns>
		private async Task<ICollection<Show>> _SearchShows(string query)
		{
			TMDbClient client = new(_apiKey.Value.ApiKey);
			return (await client.SearchMultiAsync(query))
				.Results
				.Select(x =>
				{
					return x switch
					{
						SearchTv tv => tv.ToShow(Provider),
						SearchMovie movie => movie.ToShow(Provider),
						_ => null
					};
				})
				.Where(x => x != null)
				.ToArray();
		}

		// public async Task<Season> GetSeason(Show show, int seasonNumber)
		// {
		// 	string id = show?.GetID(Provider.Name);
		// 	if (id == null)
		// 		return await Task.FromResult<Season>(null);
		// 	TMDbClient client = new TMDbClient(APIKey);
		// 	TvSeason season = await client.GetTvSeasonAsync(int.Parse(id), seasonNumber);
		// 	if (season == null)
		// 		return null;
		// 	return new Season(show.ID,
		// 		seasonNumber,
		// 		season.Name,
		// 		season.Overview,
		// 		season.AirDate?.Year,
		// 		season.PosterPath != null ? "https://image.tmdb.org/t/p/original" + season.PosterPath : null,
		// 		new[] {new MetadataID(Provider, $"{season.Id}", $"https://www.themoviedb.org/tv/{id}/season/{season.SeasonNumber}")});
		// }
		//
		// public async Task<Episode> GetEpisode(Show show, int seasonNumber, int episodeNumber, int absoluteNumber)
		// {
		// 	if (seasonNumber == -1 || episodeNumber == -1)
		// 		return await Task.FromResult<Episode>(null);
		// 	
		// 	string id = show?.GetID(Provider.Name);
		// 	if (id == null)
		// 		return await Task.FromResult<Episode>(null);
		// 	TMDbClient client = new(APIKey);
		// 	TvEpisode episode = await client.GetTvEpisodeAsync(int.Parse(id), seasonNumber, episodeNumber);
		// 	if (episode == null)
		// 		return null;
		// 	return new Episode(seasonNumber, episodeNumber, absoluteNumber,
		// 		episode.Name,
		// 		episode.Overview,
		// 		episode.AirDate,
		// 		0,
		// 		episode.StillPath != null ? "https://image.tmdb.org/t/p/original" + episode.StillPath : null,
		// 		new []
		// 		{
		// 			new MetadataID(Provider, $"{episode.Id}", $"https://www.themoviedb.org/tv/{id}/season/{episode.SeasonNumber}/episode/{episode.EpisodeNumber}")
		// 		});
		// }
	}
}