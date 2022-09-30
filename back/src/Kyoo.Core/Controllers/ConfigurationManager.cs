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
using System.Diagnostics.CodeAnalysis;
using System.Dynamic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Core.Api;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A class to ease configuration management. This work WITH Microsoft's package, you can still use IOptions patterns
	/// to access your options, this manager ease dynamic work and editing.
	/// It works with <see cref="ConfigurationReference"/>.
	/// </summary>
	public class ConfigurationManager : IConfigurationManager
	{
		/// <summary>
		/// The configuration to retrieve and edit.
		/// </summary>
		private readonly IConfiguration _configuration;

		/// <summary>
		/// The application running Kyoo, it is used to retrieve the configuration file.
		/// </summary>
		private readonly IApplication _application;

		/// <summary>
		/// The strongly typed list of options
		/// </summary>
		private readonly Dictionary<string, Type> _references;

		/// <summary>
		/// Create a new <see cref="ConfigurationApi"/> using the given configuration.
		/// </summary>
		/// <param name="configuration">The configuration to use.</param>
		/// <param name="references">The strongly typed option list.</param>
		/// <param name="application">The application running Kyoo, it is used to retrieve the configuration file.</param>
		public ConfigurationManager(IConfiguration configuration, IEnumerable<ConfigurationReference> references, IApplication application)
		{
			_configuration = configuration;
			_application = application;
			_references = references.ToDictionary(x => x.Path, x => x.Type, StringComparer.OrdinalIgnoreCase);
		}

		/// <summary>
		/// Transform the configuration section in nested expando objects.
		/// </summary>
		/// <param name="config">The section to convert</param>
		/// <returns>The converted section</returns>
		private static object _ToUntyped(IConfigurationSection config)
		{
			ExpandoObject obj = new();

			foreach (IConfigurationSection section in config.GetChildren())
			{
				obj.TryAdd(section.Key, _ToUntyped(section));
			}

			if (!obj.Any())
				return config.Value;
			return obj;
		}

		/// <inheritdoc />
		public void AddTyped<T>(string path)
		{
			foreach (ConfigurationReference confRef in ConfigurationReference.CreateReference<T>(path))
				_references.Add(confRef.Path, confRef.Type);
		}

		/// <inheritdoc />
		public void AddUntyped(string path)
		{
			ConfigurationReference config = ConfigurationReference.CreateUntyped(path);
			_references.Add(config.Path, config.Type);
		}

		/// <inheritdoc />
		public void Register(string path, Type type)
		{
			if (type == null)
			{
				ConfigurationReference config = ConfigurationReference.CreateUntyped(path);
				_references.Add(config.Path, config.Type);
			}
			else
			{
				foreach (ConfigurationReference confRef in ConfigurationReference.CreateReference(path, type))
					_references.Add(confRef.Path, confRef.Type);
			}
		}

		/// <summary>
		/// Get the type of the resource at the given path
		/// </summary>
		/// <param name="path">The path of the resource</param>
		/// <exception cref="ArgumentException">The path is not editable or readable</exception>
		/// <exception cref="ItemNotFoundException">No configuration exists for the given path</exception>
		/// <returns>The type of the resource at the given path</returns>
		private Type _GetType(string path)
		{
			path = path.Replace("__", ":");

			// TODO handle lists and dictionaries.
			if (_references.TryGetValue(path, out Type type))
			{
				if (type != null)
					return type;
				throw new ArgumentException($"The configuration at {path} is not editable or readable.");
			}

			string parent = path.Contains(':') ? path[..path.IndexOf(':')] : null;
			if (parent != null && _references.TryGetValue(parent, out type) && type == null)
				throw new ArgumentException($"The configuration at {path} is not editable or readable.");
			throw new ItemNotFoundException($"No configuration exists for the name: {path}");
		}

		/// <inheritdoc />
		public object GetValue(string path)
		{
			path = path.Replace("__", ":");
			// TODO handle lists and dictionaries.
			Type type = _GetType(path);
			object ret = _configuration.GetValue(type, path);
			if (ret != null)
				return ret;
			object option = Activator.CreateInstance(type);
			_configuration.Bind(path, option);
			return option;
		}

		/// <inheritdoc />
		public T GetValue<T>(string path)
		{
			path = path.Replace("__", ":");
			// TODO handle lists and dictionaries.
			Type type = _GetType(path);
			if (typeof(T).IsAssignableFrom(type))
			{
				throw new InvalidCastException($"The type {typeof(T).Name} is not valid for " +
					$"a resource of type {type.Name}.");
			}
			return (T)GetValue(path);
		}

		/// <inheritdoc />
		public async Task EditValue(string path, object value)
		{
			path = path.Replace("__", ":");
			Type type = _GetType(path);
			value = JObject.FromObject(value).ToObject(type);
			if (value == null)
				throw new ArgumentException("Invalid value format.");

			ExpandoObject config = _ToObject(_configuration);
			IDictionary<string, object> configDic = config;
			configDic[path] = value;
			JObject obj = JObject.FromObject(config);
			await using StreamWriter writer = new(_application.GetConfigFile());
			await writer.WriteAsync(obj.ToString());
		}

		/// <summary>
		/// Transform a configuration to a strongly typed object (the root configuration is an <see cref="ExpandoObject"/>
		/// but child elements are using strong types.
		/// </summary>
		/// <param name="config">The configuration to transform</param>
		/// <returns>A strongly typed representation of the configuration.</returns>
		[SuppressMessage("ReSharper", "RedundantJumpStatement",
			Justification = "A catch block should not be empty.")]
		private ExpandoObject _ToObject(IConfiguration config)
		{
			ExpandoObject obj = new();

			foreach (IConfigurationSection section in config.GetChildren())
			{
				try
				{
					Type type = _GetType(section.Path);
					obj.TryAdd(section.Key, section.Get(type));
				}
				catch (ArgumentException)
				{
					obj.TryAdd(section.Key, _ToUntyped(section));
				}
				catch
				{
					continue;
				}
			}

			return obj;
		}
	}
}
