using System;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Builder;
using Unity;

namespace Kyoo.Controllers
{
	/// <summary>
	/// A common interface used to discord plugins
	/// </summary>
	/// <remarks>You can inject services in the IPlugin constructor.
	/// You should only inject well known services like an ILogger, IConfiguration or IWebHostEnvironment.</remarks>
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
		/// You should put directly the type that you will register in configure, Kyoo will detect by itself which
		/// interfaces are implemented by your type.
		/// </remarks>
		Type[] Provides { get; }
		
		/// <summary>
		/// A list of services that are required by this service.
		/// The Core will warn the user that this plugin can't be loaded if a required service is not found.
		/// </summary>
		/// <remarks>
		/// Put here the most complete type that are needed for your plugin to work. If you need a LibraryManager,
		/// put typeof(ILibraryManager).
		/// </remarks>
		Type[] Requires { get; }
		
		/// <summary>
		/// True if this plugin is needed to start Kyoo. If this is true and a dependency could not be met, app startup
		/// will be canceled. If this is false, Kyoo's startup will continue without enabling this plugin.
		/// </summary>
		bool IsRequired { get; }

		/// <summary>
		/// A configure method that will be run on plugin's startup.
		/// </summary>
		/// <param name="container">A unity container to register new services.</param>
		void Configure(IUnityContainer container);
		
		/// <summary>
		/// An optional configuration step to allow a plugin to change asp net configurations.
		/// WARNING: This is only called on Kyoo's startup so you must restart the app to apply this changes.
		/// </summary>
		/// <param name="app">The Asp.Net application builder. On most case it is not needed but you can use it to add asp net functionalities.</param>
		void ConfigureAspNet(IApplicationBuilder app) {}
		
	}
}