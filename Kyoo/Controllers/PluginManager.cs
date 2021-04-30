using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using Kyoo.Models.Exceptions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Unity;

namespace Kyoo.Controllers
{
	/// <summary>
	/// An implementation of <see cref="IPluginManager"/>.
	/// This is used to load plugins and retrieve information from them.
	/// </summary>
	public class PluginManager : IPluginManager
	{
		/// <summary>
		/// The unity container. It is given to the Configure method of plugins.
		/// </summary>
		private readonly IUnityContainer _container;
		/// <summary>
		/// The configuration to get the plugin's directory.
		/// </summary>
		private readonly IConfiguration _config;
		/// <summary>
		/// The logger used by this class. 
		/// </summary>
		private readonly ILogger<PluginManager> _logger;
		
		/// <summary>
		/// The list of plugins that are currently loaded.
		/// </summary>
		private readonly List<IPlugin> _plugins = new();

		/// <summary>
		/// Create a new <see cref="PluginManager"/> instance.
		/// </summary>
		/// <param name="container">A unity container to allow plugins to register new entries</param>
		/// <param name="config">The configuration instance, to get the plugin's directory path.</param>
		/// <param name="logger">The logger used by this class.</param>
		public PluginManager(IUnityContainer container,
			IConfiguration config,
			ILogger<PluginManager> logger)
		{
			_container = container;
			_config = config;
			_logger = logger;
		}


		/// <inheritdoc />
		public T GetPlugin<T>(string name)
		{
			return (T)_plugins?.FirstOrDefault(x => x.Name == name && x is T);
		}

		/// <inheritdoc />
		public ICollection<T> GetPlugins<T>()
		{
			return _plugins?.OfType<T>().ToArray();
		}

		/// <inheritdoc />
		public ICollection<IPlugin> GetAllPlugins()
		{
			return _plugins;
		}

		/// <inheritdoc />
		public void ReloadPlugins()
		{
			string pluginFolder = _config.GetValue<string>("plugins");
			if (!Directory.Exists(pluginFolder))
				Directory.CreateDirectory(pluginFolder);

			_logger.LogTrace("Loading new plugins...");
			string[] pluginsPaths = Directory.GetFiles(pluginFolder, "*.dll", SearchOption.AllDirectories);
			ICollection<IPlugin> newPlugins = pluginsPaths.SelectMany(path =>
			{
				path = Path.GetFullPath(path);
				try
				{
					PluginDependencyLoader loader = new(path);
					Assembly assembly = loader.LoadFromAssemblyPath(path);
					return assembly.GetTypes()
						.Where(x => typeof(IPlugin).IsAssignableFrom(x))
						.Where(x => _plugins.All(y => y.GetType() != x))
						.Select(x => (IPlugin)_container.Resolve(x))
						.ToArray();
				}
				catch (Exception ex)
				{
					_logger.LogError(ex, "Could not load the plugin at {Path}", path);
					return Array.Empty<IPlugin>();
				}
			}).ToList();
			if (!_plugins.Any())
				newPlugins.Add(new CoreModule());
			_plugins.AddRange(newPlugins);

			ICollection<Type> available = _plugins.SelectMany(x => x.Provides).ToArray();
			foreach (IPlugin plugin in newPlugins)
			{
				Type missing = plugin.Requires.FirstOrDefault(x => available.All(y => !y.IsAssignableTo(x)));
				if (missing != null)
				{
					Exception error = new MissingDependencyException(plugin.Name, missing.Name);
					_logger.LogCritical(error, "A plugin's dependency could not be met");
					if (plugin.IsRequired)
						Environment.Exit(1);
				}
				else
					plugin.Configure(_container);
			}

			if (!_plugins.Any())
				_logger.LogInformation("No plugin enabled");
			else
				_logger.LogInformation("Plugin enabled: {Plugins}", _plugins.Select(x => x.Name));
		}


		/// <summary>
		/// A custom <see cref="AssemblyLoadContext"/> to load plugin's dependency if they are on the same folder.
		/// </summary>
		private class PluginDependencyLoader : AssemblyLoadContext
		{
			/// <summary>
			/// The basic resolver that will be used to load dlls.
			/// </summary>
			private readonly AssemblyDependencyResolver _resolver;

			/// <summary>
			/// Create a new <see cref="PluginDependencyLoader"/> for the given path.
			/// </summary>
			/// <param name="pluginPath">The path of the plugin and it's dependencies</param>
			public PluginDependencyLoader(string pluginPath)
			{
				_resolver = new AssemblyDependencyResolver(pluginPath);
			}

			/// <inheritdoc />
			protected override Assembly Load(AssemblyName assemblyName)
			{
				string assemblyPath = _resolver.ResolveAssemblyToPath(assemblyName);
				if (assemblyPath != null)
					return LoadFromAssemblyPath(assemblyPath);
				return base.Load(assemblyName);
			}

			/// <inheritdoc />
			protected override IntPtr LoadUnmanagedDll(string unmanagedDllName)
			{
				string libraryPath = _resolver.ResolveUnmanagedDllToPath(unmanagedDllName);
				if (libraryPath != null)
					return LoadUnmanagedDllFromPath(libraryPath);
				return base.LoadUnmanagedDll(unmanagedDllName);
			}
		}
	}
}