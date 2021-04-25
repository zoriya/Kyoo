namespace Kyoo.Controllers
{
	/// <summary>
	/// A common interface used to discord plugins
	/// </summary>
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
		/// A configure method that will be runned on plugin's startup.
		/// </summary>
		/// <remarks>
		/// You can have use any services as parameter, they will be injected from the service provider
		/// You can add managed types or any type you like using the IUnityContainer like so:
		/// <code>
		/// public static void Configure(IUnityContainer services)
		/// {
		///		services.AddTask&lt;MyTask&gt;()
		/// }
		/// </code>
		/// </remarks>
		static void Configure() { }
	}
}