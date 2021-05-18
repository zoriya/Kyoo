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
		/// Edit the value of a setting using it's path. Save it to the json file.
		/// </summary>
		/// <param name="path">The path of the resource (can be separated by ':' or '__'</param>
		/// <param name="value">The new value of the resource</param>
		/// <typeparam name="T">The type of the resource</typeparam>
		/// <exception cref="ItemNotFoundException">No setting found at the given path.</exception>
		Task EditValue<T>(string path, T value);
		
		/// <summary>
		/// Edit the value of a setting using it's path. Save it to the json file.
		/// </summary>
		/// <param name="path">The path of the resource (can be separated by ':' or '__'</param>
		/// <param name="value">The new value of the resource</param>
		/// <param name="type">The type of the resource</param>
		/// <exception cref="ItemNotFoundException">No setting found at the given path.</exception>
		Task EditValue(string path, object value, Type type);
	}
}