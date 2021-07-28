using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Kyoo.TheMovieDb.Models;
using Microsoft.Extensions.Logging;
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
		/// <summary>
		/// The logger to use in ase of issue.
		/// </summary>
		private readonly ILogger<TheMovieDbProvider> _logger;

		/// <inheritdoc />
		public Provider Provider => new()
		{
			Slug = "the-moviedb",
			Name = "TheMovieDB",
			LogoExtension = "svg",
			Images = new Dictionary<int, string>
			{
				[Thumbnails.Logo] = "https://www.themoviedb.org/assets/2/v4/logos/v2/" +
					"blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
			}
		};

		/// <summary>
		/// Create a new <see cref="TheMovieDbProvider"/> using the given api key.
		/// </summary>
		/// <param name="apiKey">The api key</param>
		/// <param name="logger">The logger to use in case of issue.</param>
		public TheMovieDbProvider(IOptions<TheMovieDbOptions> apiKey, ILogger<TheMovieDbProvider> logger)
		{
			_apiKey = apiKey;
			_logger = logger;
		}
		

		/// <inheritdoc />
		public Task<T> Get<T>(T item) 
			where T : class, IResource
		{
			return item switch
			{
				Collection collection => _GetCollection(collection) as Task<T>,
				Show show => _GetShow(show) as Task<T>,
				Season season => _GetSeason(season) as Task<T>,
				Episode episode => _GetEpisode(episode) as Task<T>,
				_ => null
			};
		}

		/// <summary>
		/// Get a collection using it's id, if the id is not present in the collection, fallback to a name search.
		/// </summary>
		/// <param name="collection">The show to collection for</param>
		/// <returns>A collection containing metadata from TheMovieDb</returns>
		private async Task<Collection> _GetCollection(Collection collection)
		{
			if (!collection.TryGetID(Provider.Slug, out int id))
			{
				Collection found = (await _SearchCollections(collection.Name ?? collection.Slug)).FirstOrDefault();
				if (found?.TryGetID(Provider.Slug, out id) != true)
					return found;
			}

			TMDbClient client = new(_apiKey.Value.ApiKey);
			return (await client.GetCollectionAsync(id)).ToCollection(Provider);
		}

		/// <summary>
		/// Get a show using it's id, if the id is not present in the show, fallback to a title search.
		/// </summary>
		/// <param name="show">The show to search for</param>
		/// <returns>A show containing metadata from TheMovieDb</returns>
		private async Task<Show> _GetShow(Show show)
		{
			if (!show.TryGetID(Provider.Slug, out int id))
			{
				Show found = (await _SearchShows(show.Title ?? show.Slug)).FirstOrDefault();
				if (found?.TryGetID(Provider.Slug, out id) != true)
					return found;
			}
			
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
		
		/// <summary>
		/// Get a season using it's show and it's season number.
		/// </summary>
		/// <param name="season">The season to retrieve metadata for.</param>
		/// <returns>A season containing metadata from TheMovieDb</returns>
		private async Task<Season> _GetSeason(Season season)
		{
			if (season.Show == null || !season.Show.TryGetID(Provider.Slug, out int id))
			{
				_logger.LogWarning("Metadata for a season was requested but it's show is not loaded. " +
					"This is unsupported");
				return null;
			}
			TMDbClient client = new(_apiKey.Value.ApiKey);
			return (await client.GetTvSeasonAsync(id, season.SeasonNumber))
				.ToSeason(id, Provider);
		}

		/// <summary>
		/// Get an episode using it's show, it's season number and it's episode number.
		/// Absolute numbering is not supported. 
		/// </summary>
		/// <param name="episode">The episode to retrieve metadata for.</param>
		/// <returns>An episode containing metadata from TheMovieDb</returns>
		private async Task<Episode> _GetEpisode(Episode episode)
		{
			if (episode.Show == null || !episode.Show.TryGetID(Provider.Slug, out int id))
			{
				_logger.LogWarning("Metadata for a season was requested but it's show is not loaded. " +
					"This is unsupported");
				return null;
			}
			if (episode.SeasonNumber == null || episode.EpisodeNumber == null)
				return null;
			
			TMDbClient client = new(_apiKey.Value.ApiKey);
			return (await client.GetTvEpisodeAsync(id, episode.SeasonNumber.Value, episode.EpisodeNumber.Value))
				.ToEpisode(id, Provider);
		}
		
		/// <inheritdoc />
		public async Task<ICollection<T>> Search<T>(string query) 
			where T : class, IResource
		{
			if (typeof(T) == typeof(Collection))
				return (await _SearchCollections(query) as ICollection<T>)!;
			if (typeof(T) == typeof(Show))
				return (await _SearchShows(query) as ICollection<T>)!;
			// if (typeof(T) == typeof(People))
			// 	return (await _SearchPeople(query) as ICollection<T>)!;
			// if (typeof(T) == typeof(Studio))
			// 	return (await _SearchStudios(query) as ICollection<T>)!;
			return ArraySegment<T>.Empty;
		}

		/// <summary>
		/// Search for a collection using it's name as a query.
		/// </summary>
		/// <param name="query">The query to search for</param>
		/// <returns>A list of collections containing metadata from TheMovieDb</returns>
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
		/// <returns>A list of shows containing metadata from TheMovieDb</returns>
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
	}
}