using Kyoo.InternalAPI.MetadataProvider;
using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;

namespace Kyoo.InternalAPI
{
    public class ProviderManager : IMetadataProvider
    {
        private readonly List<IMetadataProvider> providers = new List<IMetadataProvider>();
        private readonly IConfiguration config;

        public ProviderManager(IConfiguration configuration)
        {
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

        //public Show MergeShows(Show baseShow, Show newShow)
        //{

        //}

        
        //For all the following methods, it should use all providers and merge the data.

        public Task<Show> GetImages(Show show)
        {
            return providers[0].GetImages(show);
        }

        public Task<Season> GetSeason(string showName, int seasonNumber)
        {
            return providers[0].GetSeason(showName, seasonNumber);
        }

        public Task<Show> GetShowByID(string id)
        {
            return providers[0].GetShowByID(id);
        }

        public Task<Show> GetShowFromName(string showName, string showPath)
        {
            return providers[0].GetShowFromName(showName, showPath);
        }

        public Task<Season> GetSeason(string showName, long seasonNumber)
        {
            return providers[0].GetSeason(showName, seasonNumber);
        }

        public Task<string> GetSeasonImage(string showName, long seasonNumber)
        {
            return providers[0].GetSeasonImage(showName, seasonNumber);
        }

        public Task<Episode> GetEpisode(string externalIDs, long seasonNumber, long episodeNumber)
        {
            return providers[0].GetEpisode(externalIDs, seasonNumber, episodeNumber);
        }
    }
}
