using System;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;

namespace Kyoo.Abstractions.Controllers
{
	/// <summary>
	/// A class to ease configuration management. This work WITH Microsoft's package, you can still use IOptions patterns
	/// to access your options, this manager ease dynamic work and editing.
	/// It works with <see cref="ConfigurationReference"/>.
	/// </summary>
	public interface IConfigurationManager
	{
		/// <summary>
		/// Add an editable configuration to the editable configuration list
		/// </summary>
		/// <param name="path">The root path of the editable configuration. It should not be a nested type.</param>
		/// <typeparam name="T">The type of the configuration</typeparam>
		void AddTyped<T>(string path);
		
		/// <summary>
		/// Add an editable configuration to the editable configuration list.
		/// WARNING: this method allow you to add an unmanaged type. This type won't be editable. This can be used
		/// for external libraries or variable arguments.
		/// </summary>
		/// <param name="path">The root path of the editable configuration. It should not be a nested type.</param>
		void AddUntyped(string path);

		/// <summary>
		/// An helper method of <see cref="AddTyped{T}"/> and <see cref="AddUntyped"/>.
		/// This register a typed value if <paramref name="type"/> is not <c>null</c> and registers an untyped type
		/// if <paramref name="type"/> is <c>null</c>.
		/// </summary>
		/// <param name="path">The root path of the editable configuration. It should not be a nested type.</param>
		/// <param name="type">The type of the configuration or null.</param>
		void Register(string path, [CanBeNull] Type type);
		
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