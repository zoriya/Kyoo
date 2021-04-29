using System.Collections.Generic;
using Kyoo.Models.Exceptions;

namespace Kyoo.Controllers
{
	/// <summary>
	/// A manager to load plugins and retrieve information from them.
	/// </summary>
	public interface IPluginManager
	{
		/// <summary>
		/// Get a single plugin that match the type and name given.
		/// </summary>
		/// <param name="name">The name of the plugin</param>
		/// <typeparam name="T">The type of the plugin</typeparam>
		/// <exception cref="ItemNotFoundException">If no plugins match the query</exception>
		/// <returns>A plugin that match the queries</returns>
		public T GetPlugin<T>(string name);
		
		/// <summary>
		/// Get all plugins of the given type.
		/// </summary>
		/// <typeparam name="T">The type of plugins to get</typeparam>
		/// <returns>A list of plugins matching the given type or an empty list of none match.</returns>
		public ICollection<T> GetPlugins<T>();
		
		/// <summary>
		/// Get all plugins currently running on Kyoo. This also includes deleted plugins if the app as not been restarted.
		/// </summary>
		/// <returns>All plugins currently loaded.</returns>
		public ICollection<IPlugin> GetAllPlugins();
		
		/// <summary>
		/// Load new plugins from the plugin directory.
		/// </summary>
		/// <exception cref="MissingDependencyException">If a plugin can't be loaded because a dependency can't be resolved.</exception>
		public void ReloadPlugins();
	}
}