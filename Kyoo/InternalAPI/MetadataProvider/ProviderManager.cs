using Kyoo.InternalAPI.MetadataProvider;
using Kyoo.InternalAPI.ThumbnailsManager;
using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;

namespace Kyoo.InternalAPI
{
    public class ProviderManager : IMetadataProvider
    {
        private readonly List<IMetadataProvider> providers = new List<IMetadataProvider>();
        private readonly IThumbnailsManager thumbnailsManager;
        private readonly IConfiguration config;

        public ProviderManager(IThumbnailsManager thumbnailsManager, IConfiguration configuration)
        {
            this.thumbnailsManager = thumbnailsManager;
            config = configuration;
            LoadProviders();
        }

        void LoadProviders()
        {
            providers.Clear();
            providers.Add(new ProviderTheTvDB());

            string pluginFolder = config.GetValue<string>("providerPlugins");

            if (Directory.Exists(pluginFolder))
            {
                string[] pluginsPaths = Directory.GetFiles(pluginFolder);
                List<Assembly> plugins = new List<Assembly>();
                List<Type> types = new List<Type>();

                for (int i = 0; i < pluginsPaths.Length; i++)
                {
                    plugins.Add(Assembly.LoadFile(pluginsPaths[i]));
                    types.AddRange(plugins[i].GetTypes());
                }

                List<Type> providersPlugins = types.FindAll(x =>
                {
                    object[] atr = x.GetCustomAttributes(typeof(MetaProvider), false);

                    if (atr == null || atr.Length == 0)
                        return false;

                    List<Type> interfaces = new List<Type>(x.GetInterfaces());

                    if (interfaces.Contains(typeof(IMetadataProvider)))
                        return true;

                    return false;
                });

                providers.AddRange(providersPlugins.ConvertAll<IMetadataProvider>(x => Activator.CreateInstance(x) as IMetadataProvider));
            }
        }

        public Show Merge(IEnumerable<Show> shows)
        {
            return shows.FirstOrDefault();
        }

        public Season Merge(IEnumerable<Season> seasons)
        {
            return seasons.FirstOrDefault();
        }

        public Episode Merge(IEnumerable<Episode> episodes)
        {
            return episodes.FirstOrDefault(); //Should do something if the return is null;
        }

        //For all the following methods, it should use all providers and merge the data.

        public Task<Show> GetImages(Show show)
        {
            return providers[0].GetImages(show);
        }

        public async Task<Season> GetSeason(string showName, int seasonNumber)
        {
            List<Season> datas = new List<Season>();
            for (int i = 0; i < providers.Count; i++)
            {
                datas.Add(await providers[i].GetSeason(showName, seasonNumber));
            }

            return Merge(datas);
        }

        public async Task<Show> GetShowByID(string id)
        {
            List<Show> datas = new List<Show>();
            for (int i = 0; i < providers.Count; i++)
            {
                datas.Add(await providers[i].GetShowByID(id));
            }

            return Merge(datas);
        }

        public async Task<Show> GetShowFromName(string showName, string showPath)
        {
            List<Show> datas = new List<Show>();
            for (int i = 0; i < providers.Count; i++)
            {
                datas.Add(await providers[i].GetShowFromName(showName, showPath));
            }

            Show show = Merge(datas);
            return thumbnailsManager.Validate(show);
        }

        public async Task<Season> GetSeason(string showName, long seasonNumber)
        {
            List<Season> datas = new List<Season>();
            for (int i = 0; i < providers.Count; i++)
            {
                datas.Add(await providers[i].GetSeason(showName, seasonNumber));
            }

            return Merge(datas);
        }

        public Task<string> GetSeasonImage(string showName, long seasonNumber)
        {
            //Should select the best provider for this show.

            return providers[0].GetSeasonImage(showName, seasonNumber);
        }

        public async Task<Episode> GetEpisode(string externalIDs, long seasonNumber, long episodeNumber, long absoluteNumber, string episodePath)
        {
            List<Episode> datas = new List<Episode>();
            for (int i = 0; i < providers.Count; i++)
            {
                datas.Add(await providers[i].GetEpisode(externalIDs, seasonNumber, episodeNumber, absoluteNumber, episodePath));
            }

            Episode episode = Merge(datas);
            episode.Path = episodePath;
            return thumbnailsManager.Validate(episode);
        }

        public async Task<List<People>> GetPeople(string id)
        {
            List<People> actors = await providers[0].GetPeople(id);
            return thumbnailsManager.Validate(actors);
        }
    }
}
