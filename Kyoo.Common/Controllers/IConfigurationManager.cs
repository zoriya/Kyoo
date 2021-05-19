using System;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;

namespace Kyoo.Controllers
{
	/// <summary>
	/// A class to ease configuration management. This work WITH Microsoft's package, you can still use IOptions patterns
	/// to access your options, this manager ease dynamic work and editing.
	/// It works with <see cref="ConfigurationReference"/>.
	/// </summary>
	public interface IConfigurationManager
	{
		/// <summary>
		/// Get the value of a setting using it's path.
		/// </summary>
		/// <param name="path">The path of the resource (can be separated by ':' or '__')</param>
		/// <exception cref="ItemNotFoundException">No setting found at the given path.</exception>
		/// <returns>The value of the settings (if it's a strongly typed one, the given type is instantiated</returns>
		object GetValue(string path);
		
		/// <summary>
		/// Get the value of a setting using it's path.
		/// If your don't need a strongly typed value, see <see cref="GetValue"/>.
		/// </summary>
		/// <param name="path">The path of the resource (can be separated by ':' or '__')</param>
		/// <typeparam name="T">A type to strongly type your option.</typeparam>
		/// <exception cref="InvalidCastException">If your type is not the same as the registered type</exception>
		/// <exception cref="ItemNotFoundException">No setting found at the given path.</exception>
		/// <returns>The value of the settings (if it's a strongly typed one, the given type is instantiated</returns>
		T GetValue<T>(string path);
		
		/// <summary>
		/// Edit the value of a setting using it's path. Save it to the json file.
		/// </summary>
		/// <param name="path">The path of the resource (can be separated by ':' or '__')</param>
		/// <param name="value">The new value of the resource</param>
		/// <exception cref="ItemNotFoundException">No setting found at the given path.</exception>
		Task EditValue(string path, object value);
	}
}