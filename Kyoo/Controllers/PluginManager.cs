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
		private readonly IServiceProvider provider;
		private readonly IConfiguration config;
		private List<IPlugin> plugins;

		public PluginManager(IServiceProvider provider, IConfiguration config)
		{
			this.provider = provider;
			this.config = config;
		}

		public T GetPlugin<T>(string name)
		{
			return (T)(from plugin in plugins where plugin.Name == name && plugin is T
				select plugin).FirstOrDefault();
		}

		public IEnumerable<T> GetPlugins<T>()
		{
			return from plugin in plugins where plugin is T
				select (T)plugin;
		}

		public void ReloadPlugins()
		{
			string pluginFolder = config.GetValue<string>("plugins");

			if (!Directory.Exists(pluginFolder)) 
				return;
			string[] pluginsPaths = Directory.GetFiles(pluginFolder);

			plugins = pluginsPaths.Select(path =>
			{
				Assembly ass = Assembly.LoadFile(path);
				return (from type in ass.GetTypes() 
					where typeof(IPlugin).IsAssignableFrom(type) 
					select (IPlugin)ActivatorUtilities.CreateInstance(provider, type, null)).FirstOrDefault();
			}).Where(x => x != null).ToList();
		}
	}
}