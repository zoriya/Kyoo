using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Controllers
{
	public class PluginDependencyLoader : AssemblyLoadContext
	{
		private readonly AssemblyDependencyResolver _resolver;
		
		public PluginDependencyLoader(string pluginPath)
		{
			_resolver = new AssemblyDependencyResolver(pluginPath);
		}

		protected override Assembly Load(AssemblyName assemblyName)
		{
			string assemblyPath = _resolver.ResolveAssemblyToPath(assemblyName);
			if (assemblyPath != null)
				return LoadFromAssemblyPath(assemblyPath);
			return base.Load(assemblyName);
		}
		
		protected override IntPtr LoadUnmanagedDll(string unmanagedDllName)
		{
			string libraryPath = _resolver.ResolveUnmanagedDllToPath(unmanagedDllName);
			if (libraryPath != null)
				return LoadUnmanagedDllFromPath(libraryPath);
			return base.LoadUnmanagedDll(unmanagedDllName);
		}
	}
	
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
			return (T)_plugins?.FirstOrDefault(x => x.Name == name && x is T);
		}

		public IEnumerable<T> GetPlugins<T>()
		{
			return _plugins?.OfType<T>() ?? new List<T>();
		}

		public IEnumerable<IPlugin> GetAllPlugins()
		{
			return _plugins ?? new  List<IPlugin>();
		}

		public void ReloadPlugins()
		{
			string pluginFolder = _config.GetValue<string>("plugins");
			if (!Directory.Exists(pluginFolder))
				Directory.CreateDirectory(pluginFolder);

			string[] pluginsPaths = Directory.GetFiles(pluginFolder);
			_plugins = pluginsPaths.SelectMany(path =>
			{
				path = Path.GetFullPath(path);
				try
				{
					PluginDependencyLoader loader = new(path);
					Assembly ass = loader.LoadFromAssemblyPath(path);
					return ass.GetTypes()
						.Where(x => typeof(IPlugin).IsAssignableFrom(x))
						.Select(x => (IPlugin)ActivatorUtilities.CreateInstance(_provider, x));
				}
				catch (Exception ex)
				{
					Console.Error.WriteLine($"\nError loading the plugin at {path}.\n{ex.GetType().Name}: {ex.Message}\n");
					return Array.Empty<IPlugin>();
				}
			}).ToList();
			
			if (!_plugins.Any())
			{
				Console.WriteLine("\nNo plugin enabled.\n");
				return;
			}

			Console.WriteLine("\nPlugin enabled:");
			foreach (IPlugin plugin in _plugins)
				Console.WriteLine($"\t{plugin.Name}");
			Console.WriteLine();
		}
	}
}