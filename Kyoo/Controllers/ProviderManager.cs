using System;
using Kyoo.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Kyoo.Controllers
{
	public class ProviderManager : IProviderManager
	{
		private readonly IEnumerable<IMetadataProvider> _providers;

		public ProviderManager(IPluginManager pluginManager)
		{
			_providers = pluginManager.GetPlugins<IMetadataProvider>();
		}

		private async Task<T> GetMetadata<T>(Func<IMetadataProvider, Task<T>> providerCall, Library library, string what) 
			where T : IMergable<T>, new()
		{
			T ret = new T();

			if (library.Providers == null)
				return ret;
			
			foreach (IMetadataProvider provider in _providers.OrderBy(provider => Array.IndexOf(library.Providers, provider.Name)))
			{
				try
				{
					if (library.Providers.Contains(provider.Name))
						ret = ret.Merge(await providerCall(provider));
				} catch (Exception ex) {
					Console.Error.WriteLine($"\tThe provider {provider.Name} coudln't work for {what}. Exception: {ex.Message}");
				}
			}
			return ret;
		}

		private async Task<IEnumerable<T>> GetMetadata<T>(Func<IMetadataProvider, Task<IEnumerable<T>>> providerCall, Library library, string what)
		{
			List<T> ret = new List<T>();
			
			if (library.Providers == null)
				return ret;
			
			foreach (IMetadataProvider provider in _providers.OrderBy(provider => Array.IndexOf(library.Providers, provider.Name)))
			{
				try
				{
					if (library.Providers.Contains(provider.Name))
						ret.AddRange(await providerCall(provider) ?? new List<T>());
				} catch (Exception ex) {
					Console.Error.WriteLine($"\tThe provider {provider.Name} coudln't work for {what}. Exception: {ex.Message}");
				}
			}
			return ret;
		}
		
		public async Task<Collection> GetCollectionFromName(string name, Library library)
		{
			Collection collection = await GetMetadata(provider => provider.GetCollectionFromName(name), library, $"the collection {name}");
			collection.Name ??= name;
			collection.Slug ??= Utility.ToSlug(name);
			return collection;
		}

		public async Task<Show> SearchShow(string showName, bool isMovie, Library library)
		{
			Show show = await GetMetadata(async provider => (await provider.GetShowsFromName(showName, isMovie))?.FirstOrDefault(), library, $"the show {showName}");
			show.Slug = Utility.ToSlug(showName);
			show.Title ??= showName;
			show.IsMovie = isMovie;
			return show;
		}
		
		public async Task<IEnumerable<Show>> SearchShows(string showName, bool isMovie, Library library)
		{
			IEnumerable<Show> shows = await GetMetadata(provider => provider.GetShowsFromName(showName, isMovie), library, $"the show {showName}");
			return shows.Select(show =>
			{
				show.Slug = Utility.ToSlug(showName);
				show.Title ??= showName;
				show.IsMovie = isMovie;
				return show;
			});
		}

		public async Task<Season> GetSeason(Show show, long seasonNumber, Library library)
		{
			Season season = await GetMetadata(provider => provider.GetSeason(show, seasonNumber), library, $"the season {seasonNumber} of {show.Title}");
			season.Show = show;
			season.SeasonNumber = season.SeasonNumber == -1 ? seasonNumber : season.SeasonNumber;
			season.Title ??= $"Season {season.SeasonNumber}";
			return season;
		}

		public async Task<Episode> GetEpisode(Show show, string episodePath, long seasonNumber, long episodeNumber, long absoluteNumber,  Library library)
		{
			Episode episode = await GetMetadata(provider => provider.GetEpisode(show, seasonNumber, episodeNumber, absoluteNumber), library, "an episode");
			episode.Show = show;
			episode.Path = episodePath;
			episode.SeasonNumber = episode.SeasonNumber != -1 ? episode.SeasonNumber : seasonNumber;
			episode.EpisodeNumber = episode.EpisodeNumber != -1 ? episode.EpisodeNumber : episodeNumber;
			episode.AbsoluteNumber = episode.AbsoluteNumber != -1 ? episode.AbsoluteNumber : absoluteNumber;
			return episode;
		}

		public async Task<IEnumerable<PeopleLink>> GetPeople(Show show, Library library)
		{
			IEnumerable<PeopleLink> people = await GetMetadata(provider => provider.GetPeople(show), library, $"a cast member of {show.Title}");
			return people;
		}
	}
}
