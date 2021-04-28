using JetBrains.Annotations;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Unity;

namespace Kyoo.Controllers
{
	/// <summary>
	/// A common interface used to discord plugins
	/// </summary>
	[UsedImplicitly(ImplicitUseTargetFlags.WithInheritors)]
	public interface IPlugin
	{
		/// <summary>
		/// A slug to identify this plugin in queries.
		/// </summary>
		string Slug { get; }
		
		/// <summary>
		/// The name of the plugin
		/// </summary>
		string Name { get; }
		
		/// <summary>
		/// The description of this plugin. This will be displayed on the "installed plugins" page.
		/// </summary>
		string Description { get; }
		
		/// <summary>
		/// A list of services that are provided by this service. This allow other plugins to declare dependencies.
		/// </summary>
		/// <remarks>
		/// The format should be the name of the interface ':' and the name of the implementation.
		/// For a plugins that provide a new service named IService with a default implementation named Koala, that would
		/// be "IService:Koala".
		/// </remarks>
		string[] Provides { get; }
		
		/// <summary>
		/// A list of services that are required by this service.
		/// The Core will warn the user that this plugin can't be loaded if a required service is not found.
		/// </summary>
		/// <remarks>
		/// This is the same format as <see cref="Provides"/> but you may leave a blank implementation's name if you don't need a special one.
		/// For example, if you need a service named IService but you don't care what implementation it will be, you can use
		/// "IService:"
		/// </remarks>
		string[] Requires { get; }

		/// <summary>
		/// A configure method that will be run on plugin's startup.
		/// </summary>
		/// <param name="container">A unity container to register new services.</param>
		/// <param name="config">The configuration, if you need values at config time (database connection strings...)</param>
		/// <param name="app">The Asp.Net application builder. On most case it is not needed but you can use it to add asp net functionalities.</param>
		/// <param name="debugMode">True if the app should run in debug mode.</param>
		void Configure(IUnityContainer container, IConfiguration config, IApplicationBuilder app, bool debugMode);
	}
}