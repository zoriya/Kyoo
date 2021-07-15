using System;
using Kyoo.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Kyoo.Controllers
{
	/// <summary>
	/// A metadata provider composite that merge results from all available providers.
	/// </summary>
	public class ProviderComposite : IProviderComposite
	{
		/// <summary>
		/// The list of metadata providers
		/// </summary>
		private readonly ICollection<IMetadataProvider> _providers;

		/// <summary>
		/// The list of selected providers. If no provider has been selected, this is null.
		/// </summary>
		private ICollection<Provider> _selectedProviders;

		/// <summary>
		/// The logger used to print errors.
		/// </summary>
		private readonly ILogger<ProviderComposite> _logger;
		
		/// <summary>
		/// Since this is a composite and not a real provider, no metadata is available.
		/// It is not meant to be stored or selected. This class will handle merge based on what is required. 
		/// </summary>
		public Provider Provider => null;


		/// <summary>
		/// Create a new <see cref="ProviderComposite"/> with a list of available providers.
		/// </summary>
		/// <param name="providers">The list of providers to merge.</param>
		/// <param name="logger">The logger used to print errors.</param>
		public ProviderComposite(IEnumerable<IMetadataProvider> providers, ILogger<ProviderComposite> logger)
		{
			_providers = providers.ToArray();
			_logger = logger;
		}
		

		/// <inheritdoc />
		public void UseProviders(IEnumerable<Provider> providers)
		{
			_selectedProviders = providers.ToArray();
		}

		/// <summary>
		/// Return the list of providers that should be used for queries.
		/// </summary>
		/// <returns>The list of providers to use, respecting the <see cref="UseProviders"/>.</returns>
		private IEnumerable<IMetadataProvider> _GetProviders()
		{
			return _selectedProviders?
					.Select(x => _providers.FirstOrDefault(y => y.Provider.Slug == x.Slug))
					.Where(x => x != null)
				?? _providers;
		}

		/// <inheritdoc />
		public async Task<T> Get<T>(T item)
			where T : class, IResource
		{
			T ret = null;
			
			foreach (IMetadataProvider provider in _GetProviders())
			{
				try
				{
					ret = Merger.Merge(ret, await provider.Get(ret ?? item));
				}
				catch (NotSupportedException)
				{
					// Silenced
				}
				catch (Exception ex) 
				{
					_logger.LogError(ex, "The provider {Provider} could not get a {Type}", 
						provider.Provider.Name, typeof(T).Name);
				}
			}

			return Merger.Merge(ret, item);
		}

		/// <inheritdoc />
		public async Task<ICollection<T>> Search<T>(string query) 
			where T : class, IResource
		{
			List<T> ret = new();
			
			foreach (IMetadataProvider provider in _GetProviders())
			{
				try
				{
					ret.AddRange(await provider.Search<T>(query));
				}
				catch (NotSupportedException)
				{
					// Silenced
				}
				catch (Exception ex) 
				{
					_logger.LogError(ex, "The provider {Provider} could not search for {Type}", 
						provider.Provider.Name, typeof(T).Name);
				}
			}

			return ret;
		}

		public Task<ICollection<PeopleRole>> GetPeople(Show show)
		{
			throw new NotImplementedException();
		}

		// public async Task<Collection> GetCollectionFromName(string name, Library library)
		// {
		// 	Collection collection = await GetMetadata(
		// 		provider => provider.GetCollectionFromName(name), 
		// 		library,
		// 		$"the collection {name}");
		// 	collection.Name ??= name;
		// 	collection.Slug ??= Utility.ToSlug(name);
		// 	return collection;
		// }
  //
		// public async Task<Show> CompleteShow(Show show, Library library)
		// {
		// 	return await GetMetadata(provider => provider.GetShowByID(show), library, $"the show {show.Title}");
		// }
  //
		// public async Task<Show> SearchShow(string showName, bool isMovie, Library library)
		// {
		// 	Show show = await GetMetadata(async provider =>
		// 	{
		// 		Show searchResult = (await provider.SearchShows(showName, isMovie))?.FirstOrDefault();
		// 		if (searchResult == null)
		// 			return null;
		// 		return await provider.GetShowByID(searchResult);
		// 	}, library, $"the show {showName}");
		// 	show.Slug = Utility.ToSlug(showName);
		// 	show.Title ??= showName;
		// 	show.IsMovie = isMovie;
		// 	show.Genres = show.Genres?.GroupBy(x => x.Slug).Select(x => x.First()).ToList();
		// 	show.People = show.People?.GroupBy(x => x.Slug).Select(x => x.First()).ToList();
		// 	return show;
		// }
		//
		// public async Task<IEnumerable<Show>> SearchShows(string showName, bool isMovie, Library library)
		// {
		// 	IEnumerable<Show> shows = await GetMetadata(
		// 		provider => provider.SearchShows(showName, isMovie),
		// 		library,
		// 		$"the show {showName}");
		// 	return shows.Select(show =>
		// 	{
		// 		show.Slug = Utility.ToSlug(showName);
		// 		show.Title ??= showName;
		// 		show.IsMovie = isMovie;
		// 		return show;
		// 	});
		// }
  //
		// public async Task<Season> GetSeason(Show show, int seasonNumber, Library library)
		// {
		// 	Season season = await GetMetadata(
		// 		provider => provider.GetSeason(show, seasonNumber), 
		// 		library, 
		// 		$"the season {seasonNumber} of {show.Title}");
		// 	season.Show = show;
		// 	season.ShowID = show.ID;
		// 	season.ShowSlug = show.Slug;
		// 	season.Title ??= $"Season {season.SeasonNumber}";
		// 	return season;
		// }
  //
		// public async Task<Episode> GetEpisode(Show show, 
		// 	string episodePath,
		// 	int? seasonNumber, 
		// 	int? episodeNumber,
		// 	int? absoluteNumber,
		// 	Library library)
		// {
		// 	Episode episode = await GetMetadata(
		// 		provider => provider.GetEpisode(show, seasonNumber, episodeNumber, absoluteNumber),
		// 		library, 
		// 		"an episode");
		// 	episode.Show = show;
		// 	episode.ShowID = show.ID;
		// 	episode.ShowSlug = show.Slug;
		// 	episode.Path = episodePath;
		// 	episode.SeasonNumber ??= seasonNumber;
		// 	episode.EpisodeNumber ??= episodeNumber;
		// 	episode.AbsoluteNumber ??= absoluteNumber;
		// 	return episode;
		// }
  //
		// public async Task<ICollection<PeopleRole>> GetPeople(Show show, Library library)
		// {
		// 	List<PeopleRole> people = await GetMetadata(
		// 		provider => provider.GetPeople(show),
		// 		library, 
		// 		$"a cast member of {show.Title}");
		// 	return people?.GroupBy(x => x.Slug)
		// 		.Select(x => x.First())
		// 		.Select(x =>
		// 		{
		// 			x.Show = show;
		// 			x.ShowID = show.ID;
		// 			return x;
		// 		}).ToList();
		// }
	}
}
