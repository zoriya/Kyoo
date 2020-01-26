using System;
using Kyoo.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Controllers.ThumbnailsManager;

namespace Kyoo.Controllers
{
    public class ProviderManager : IProviderManager
    {
        private readonly IEnumerable<IMetadataProvider> providers;
        private readonly IThumbnailsManager thumbnailsManager;

        public ProviderManager(IThumbnailsManager thumbnailsManager, IPluginManager pluginManager)
        {
            this.thumbnailsManager = thumbnailsManager;
            providers = pluginManager.GetPlugins<IMetadataProvider>();
        }

        public async Task<T> GetMetadata<T>(Func<IMetadataProvider, Task<T>> providerCall, Library library, string what) where T : IMergable<T>, new()
        {
            T ret = new T();
            
            foreach (IMetadataProvider provider in providers.OrderBy(provider => Array.IndexOf(library.Providers, provider.Name)))
            {
                try
                {
                    if (library.Providers.Contains(provider.Name))
                        ret = ret.Merge(await providerCall(provider));
                } catch (Exception ex) {
                    Console.Error.WriteLine($"The provider {provider.Name} coudln't work for {what}. Exception: {ex.Message}");
                }
            }
            return ret;
        }
        
        public async Task<IEnumerable<T>> GetMetadata<T>(Func<IMetadataProvider, Task<IEnumerable<T>>> providerCall, Library library, string what)
        {
            List<T> ret = new List<T>();
            
            foreach (IMetadataProvider provider in providers.OrderBy(provider => Array.IndexOf(library.Providers, provider.Name)))
            {
                try
                {
                    if (library.Providers.Contains(provider.Name))
                        ret.AddRange(await providerCall(provider));
                } catch (Exception ex) {
                    Console.Error.WriteLine($"The provider {provider.Name} coudln't work for {what}. Exception: {ex.Message}");
                }
            }
            return ret;
        }
        
        public async Task<Collection> GetCollectionFromName(string name, Library library)
        {
            return await GetMetadata(provider => provider.GetCollectionFromName(name), library, $"the collection {name}");
        }

        public async Task<Show> GetShowFromName(string showName, Library library)
        {
            Show show = await GetMetadata(provider => provider.GetShowFromName(showName), library, $"the show {showName}");
            await thumbnailsManager.Validate(show);
            return show;
        }

        public async Task<Season> GetSeason(Show show, long seasonNumber, Library library)
        {
            return await GetMetadata(provider => provider.GetSeason(show, seasonNumber), library, $"the season {seasonNumber} of {show.Title}");
        }

        public async Task<Episode> GetEpisode(Show show, long seasonNumber, long episodeNumber, long absoluteNumber,  Library library)
        {
            Episode episode = await GetMetadata(provider => provider.GetEpisode(show, seasonNumber, episodeNumber, absoluteNumber), library, "an episode");
            await thumbnailsManager.Validate(episode);
            return episode;
        }

        public async Task<IEnumerable<People>> GetPeople(Show show, Library library)
        {
            IEnumerable<People> people = await GetMetadata(provider => provider.GetPeople(show), library, "unknown data");
            people = await thumbnailsManager.Validate(people);
            return people;
        }
    }
}
