using System;

namespace Kyoo.Models.Exceptions
{
	/// <summary>
	/// An exception raised when a plugin requires dependencies that can't be found with the current configuration.
	/// </summary>
	[Serializable]
	public class MissingDependencyException : Exception
	{
		/// <summary>
		/// Create a new <see cref="MissingDependencyException"/> with a custom message
		/// </summary>
		/// <param name="plugin">The name of the plugin that can't be loaded.</param>
		/// <param name="dependency">The name of the missing dependency.</param>
		public MissingDependencyException(string plugin, string dependency)
			: base($"No {dependency} are available in Kyoo but the plugin {plugin} requires it.")
		{}
	}
}