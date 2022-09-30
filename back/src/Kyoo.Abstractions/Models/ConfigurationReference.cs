// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System;
using System.Collections.Generic;
using System.Reflection;
using JetBrains.Annotations;
using Kyoo.Utils;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A class given information about a strongly typed configuration.
	/// </summary>
	public class ConfigurationReference
	{
		/// <summary>
		/// The path of the resource (separated by ':')
		/// </summary>
		public string Path { get; }

		/// <summary>
		/// The type of the resource.
		/// </summary>
		public Type Type { get; }

		/// <summary>
		/// Create a new <see cref="ConfigurationReference"/> using a given path and type.
		/// This method does not create sub configuration resources. Please see <see cref="CreateReference"/>
		/// </summary>
		/// <param name="path">The path of the resource (separated by ':' or "__")</param>
		/// <param name="type">The type of the resource</param>
		/// <seealso cref="CreateReference"/>
		public ConfigurationReference(string path, Type type)
		{
			Path = path;
			Type = type;
		}

		/// <summary>
		/// Return the list of configuration reference a type has.
		/// </summary>
		/// <param name="path">
		/// The base path of the type (separated by ':' or "__". If empty, it will start at root)
		/// </param>
		/// <param name="type">The type of the object</param>
		/// <returns>The list of configuration reference a type has.</returns>
		public static IEnumerable<ConfigurationReference> CreateReference(string path, [NotNull] Type type)
		{
			if (type == null)
				throw new ArgumentNullException(nameof(type));

			List<ConfigurationReference> ret = new()
			{
				new ConfigurationReference(path, type)
			};

			if (!type.IsClass || type.AssemblyQualifiedName?.StartsWith("System") == true)
				return ret;

			Type enumerable = Utility.GetGenericDefinition(type, typeof(IEnumerable<>));
			Type dictionary = Utility.GetGenericDefinition(type, typeof(IDictionary<,>));
			Type dictionaryKey = dictionary?.GetGenericArguments()[0];

			if (dictionary != null && dictionaryKey == typeof(string))
				ret.AddRange(CreateReference($"{path}:{type.Name}:*", dictionary.GetGenericArguments()[1]));
			else if (dictionary != null && dictionaryKey == typeof(int))
				ret.AddRange(CreateReference($"{path}:{type.Name}:", dictionary.GetGenericArguments()[1]));
			else if (enumerable != null)
				ret.AddRange(CreateReference($"{path}:{type.Name}:", enumerable.GetGenericArguments()[0]));
			else
			{
				foreach (PropertyInfo child in type.GetProperties())
					ret.AddRange(CreateReference($"{path}:{child.Name}", child.PropertyType));
			}

			return ret;
		}

		/// <summary>
		/// Return the list of configuration reference a type has.
		/// </summary>
		/// <param name="path">
		/// The base path of the type (separated by ':' or "__". If empty, it will start at root)
		/// </param>
		/// <typeparam name="T">The type of the object</typeparam>
		/// <returns>The list of configuration reference a type has.</returns>
		public static IEnumerable<ConfigurationReference> CreateReference<T>(string path)
		{
			return CreateReference(path, typeof(T));
		}

		/// <summary>
		/// Return a <see cref="ConfigurationReference"/> meaning that the given path is of any type.
		/// It means that the type can't be edited.
		/// </summary>
		/// <param name="path">
		/// The path that will be untyped (separated by ':' or "__". If empty, it will start at root).
		/// </param>
		/// <returns>A configuration reference representing a path of any type.</returns>
		public static ConfigurationReference CreateUntyped(string path)
		{
			return new ConfigurationReference(path, null);
		}
	}
}
