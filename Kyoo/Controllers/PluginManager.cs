using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using Kyoo.Models.Exceptions;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Kyoo.Controllers
{
	/// <summary>
	/// An implementation of <see cref="IPluginManager"/>.
	/// This is used to load plugins and retrieve information from them.
	/// </summary>
	public class PluginManager : IPluginManager
	{
		/// <summary>
		/// The service provider. It allow plugin's activation.
		/// </summary>
		private readonly IServiceProvider _provider;
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
		/// <param name="provider">A service container to allow initialization of plugins</param>
		/// <param name="config">The configuration instance, to get the plugin's directory path.</param>
		/// <param name="logger">The logger used by this class.</param>
		public PluginManager(IServiceProvider provider,
			IConfiguration config,
			ILogger<PluginManager> logger)
		{
			_provider = provider;
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
		public void LoadPlugins(ICollection<IPlugin> plugins)
		{
			string pluginFolder = _config.GetValue<string>("plugins");
			if (!Directory.Exists(pluginFolder))
				Directory.CreateDirectory(pluginFolder);

			_logger.LogTrace("Loading new plugins...");
			string[] pluginsPaths = Directory.GetFiles(pluginFolder, "*.dll", SearchOption.AllDirectories);
			plugins = pluginsPaths.SelectMany(path =>
			{
				path = Path.GetFullPath(path);
				try
				{
					PluginDependencyLoader loader = new(path);
					Assembly assembly = loader.LoadFromAssemblyPath(path);
					return assembly.GetTypes()
						.Where(x => typeof(IPlugin).IsAssignableFrom(x))
						.Where(x => _plugins.All(y => y.GetType() != x))
						.Select(x => (IPlugin)ActivatorUtilities.CreateInstance(_provider, x))
						.ToArray();
				}
				catch (Exception ex)
				{
					_logger.LogError(ex, "Could not load the plugin at {Path}", path);
					return Array.Empty<IPlugin>();
				}
			}).Concat(plugins).ToList();

			ICollection<Type> available = GetProvidedTypes();
			_plugins.AddRange(plugins.Where(plugin =>
			{
				Type missing = plugin.Requires.FirstOrDefault(x => available.All(y => !y.IsAssignableTo(x)));
				if (missing == null)
					return true;
				
				Exception error = new MissingDependencyException(plugin.Name, missing.Name);
				_logger.LogCritical(error, "A plugin's dependency could not be met");
				return false;
			}));
			
			if (!_plugins.Any())
				_logger.LogInformation("No plugin enabled");
			else
				_logger.LogInformation("Plugin enabled: {Plugins}", _plugins.Select(x => x.Name));
		}
		
		/// <inheritdoc />
		public void ConfigureServices(IServiceCollection services)
		{
			ICollection<Type> available = GetProvidedTypes();
			foreach (IPlugin plugin in _plugins)
				plugin.Configure(services, available);
		}

		/// <inheritdoc />
		public void ConfigureAspnet(IApplicationBuilder app)
		{
			foreach (IPlugin plugin in _plugins)
				plugin.ConfigureAspNet(app);
		}

		/// <summary>
		/// Get the list of types provided by the currently loaded plugins.
		/// </summary>
		/// <returns>The list of types available.</returns>
		private ICollection<Type> GetProvidedTypes()
		{
			List<Type> available = _plugins.SelectMany(x => x.Provides).ToList();
			List<ConditionalProvide> conditionals =_plugins
				.SelectMany(x => x.ConditionalProvides)
				.Where(x => x.Condition.Condition())
				.ToList();

			bool IsAvailable(ConditionalProvide conditional, bool log = false)
			{
				if (!conditional.Condition.Condition())
					return false;

				ICollection<Type> needed = conditional.Condition.Needed
					.Where(y => !available.Contains(y))
					.ToList();
				// TODO handle circular dependencies, actually it might stack overflow.
				needed = needed.Where(x => !conditionals
						.Where(y => y.Type == x)
						.Any(y => IsAvailable(y)))
					.ToList();
				if (!needed.Any())
					return true;
				if (log && available.All(x => x != conditional.Type))
				{
					_logger.LogWarning("The type {Type} is not available, {Dependencies} could not be met",
						conditional.Type.Name,
						needed.Select(x => x.Name));
				}
				return false;
			}

			// ReSharper disable once ForeachCanBeConvertedToQueryUsingAnotherGetEnumerator
			foreach (ConditionalProvide conditional in conditionals)
			{
				if (IsAvailable(conditional, true))
					available.Add(conditional.Type);
			}
			return available;
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