using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using Autofac;
using Kyoo.Models.Options;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

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
		private IServiceProvider _provider;
		/// <summary>
		/// The configuration to get the plugin's directory.
		/// </summary>
		private readonly IOptions<BasicOptions> _options;
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
		/// <param name="options">The configuration instance, to get the plugin's directory path.</param>
		/// <param name="logger">The logger used by this class.</param>
		public PluginManager(IServiceProvider provider,
			IOptions<BasicOptions> options,
			ILogger<PluginManager> logger)
		{
			_provider = provider;
			_options = options;
			_logger = logger;
		}

		public void SetProvider(IServiceProvider provider)
		{
			// TODO temporary bullshit to inject services before the configure asp net.
			// TODO should rework this when the host will be reworked, as well as the asp net configure.
			_provider = provider;
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

		/// <summary>
		/// Load a single plugin and return all IPlugin implementations contained in the Assembly.
		/// </summary>
		/// <param name="path">The path of the dll</param>
		/// <returns>The list of dlls in hte assembly</returns>
		private IPlugin[] LoadPlugin(string path)
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
		}
		
		/// <inheritdoc />
		public void LoadPlugins(ICollection<IPlugin> plugins)
		{
			string pluginFolder = _options.Value.PluginPath;
			if (!Directory.Exists(pluginFolder))
				Directory.CreateDirectory(pluginFolder);

			_logger.LogTrace("Loading new plugins...");
			string[] pluginsPaths = Directory.GetFiles(pluginFolder, "*.dll", SearchOption.AllDirectories);
			_plugins.AddRange(plugins
				.Concat(pluginsPaths.SelectMany(LoadPlugin))
				.GroupBy(x => x.Name)
				.Select(x => x.First())
			);
			
			if (!_plugins.Any())
				_logger.LogInformation("No plugin enabled");
			else
				_logger.LogInformation("Plugin enabled: {Plugins}", _plugins.Select(x => x.Name));
		}

		/// <inheritdoc />
		public void LoadPlugins(params Type[] plugins)
		{
			LoadPlugins(plugins
				.Select(x => (IPlugin)ActivatorUtilities.CreateInstance(_provider, x))
				.ToArray()
			);
		}

		/// <inheritdoc />
		public void ConfigureContainer(ContainerBuilder builder)
		{
			foreach (IPlugin plugin in _plugins)
				plugin.Configure(builder);
		}
		
		/// <inheritdoc />
		public void ConfigureServices(IServiceCollection services)
		{
			foreach (IPlugin plugin in _plugins)
				plugin.Configure(services);
		}

		/// <inheritdoc />
		public void ConfigureAspnet(IApplicationBuilder app)
		{
			foreach (IPlugin plugin in _plugins)
			{
				using IServiceScope scope = _provider.CreateScope();
				Helper.InjectServices(plugin, x => scope.ServiceProvider.GetRequiredService(x));
				plugin.ConfigureAspNet(app);
				Helper.InjectServices(plugin, _ => null);
			}
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
				Assembly existing = AppDomain.CurrentDomain.GetAssemblies()
					.FirstOrDefault(x =>
					{
						AssemblyName name = x.GetName();
						return name.Name == assemblyName.Name && name.Version == assemblyName.Version;
					});
				if (existing != null)
					return existing;
				// TODO load the assembly from the common folder if the file exists (this would allow shared libraries)
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