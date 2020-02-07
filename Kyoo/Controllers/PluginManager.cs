using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Controllers
{
	public class PluginManager : IPluginManager
	{
		private readonly IServiceProvider _provider;
		private readonly IConfiguration _config;
		private List<IPlugin> _plugins;

		public PluginManager(IServiceProvider provider, IConfiguration config)
		{
			_provider = provider;
			_config = config;
		}

		public T GetPlugin<T>(string name)
        {
            if (_plugins == null)
                return default;
			return (T)(from plugin in _plugins where plugin.Name == name && plugin is T select plugin).FirstOrDefault();
		}

		public IEnumerable<T> GetPlugins<T>()
        {
            if (_plugins == null)
                return new List<T>();
			return from plugin in _plugins where plugin is T select (T)plugin;
		}

		public void ReloadPlugins()
		{
			string pluginFolder = _config.GetValue<string>("plugins");

			if (!Directory.Exists(pluginFolder)) 
				return;
			string[] pluginsPaths = Directory.GetFiles(pluginFolder);

			_plugins = pluginsPaths.Select(path =>
			{
                try
                {
                    Assembly ass = Assembly.LoadFile(Path.GetFullPath(path));
                    return (from type in ass.GetTypes()
                        where typeof(IPlugin).IsAssignableFrom(type)
                        select (IPlugin) ActivatorUtilities.CreateInstance(_provider, type)).FirstOrDefault();
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"Error loading the plugin at {path}.\nException: {ex.Message}");
                    return null;
                }
            }).Where(x => x != null).ToList();
		}
	}
}