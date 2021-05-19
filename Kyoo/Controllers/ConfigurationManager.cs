using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Dynamic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Api;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;

namespace Kyoo.Controllers
{
	public class ConfigurationManager : IConfigurationManager
	{
		/// <summary>
		/// The configuration to retrieve and edit. 
		/// </summary>
		private readonly IConfiguration _configuration;

		/// <summary>
		/// The strongly typed list of options
		/// </summary>
		private readonly Dictionary<string, Type> _references;

		/// <summary>
		/// Create a new <see cref="ConfigurationApi"/> using the given configuration.
		/// </summary>
		/// <param name="configuration">The configuration to use.</param>
		/// <param name="references">The strongly typed option list.</param>
		public ConfigurationManager(IConfiguration configuration, IEnumerable<ConfigurationReference> references)
		{
			_configuration = configuration;
			_references = references.ToDictionary(x => x.Path, x => x.Type, StringComparer.OrdinalIgnoreCase);
		}

		private Type GetType(string path)
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
			Type type = GetType(path);
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
			Type type = GetType(path);
			if (typeof(T).IsAssignableFrom(type))
				throw new InvalidCastException($"The type {typeof(T).Name} is not valid for " +
				                               $"a resource of type {type.Name}.");
			return (T)GetValue(path);
		}
		
		/// <inheritdoc />
		public async Task EditValue(string path, object value)
		{
			path = path.Replace("__", ":");
			Type type = GetType(path);
			value = JObject.FromObject(value).ToObject(type);
			if (value == null)
				throw new ArgumentException("Invalid value format.");
			
			ExpandoObject config = ToObject(_configuration);
			IDictionary<string, object> configDic = config;
			configDic[path] = value;
			JObject obj = JObject.FromObject(config);
			await using StreamWriter writer = new(Program.JsonConfigPath);
			await writer.WriteAsync(obj.ToString());
		}
		
		/// <summary>
		/// Transform a configuration to a strongly typed object (the root configuration is an <see cref="ExpandoObject"/>
		/// but child elements are using strong types.
		/// </summary>
		/// <param name="config">The configuration to transform</param>
		/// <returns>A strongly typed representation of the configuration.</returns>
		[SuppressMessage("ReSharper", "RedundantJumpStatement")]
		private ExpandoObject ToObject(IConfiguration config)
		{
			ExpandoObject obj = new();

			foreach (IConfigurationSection section in config.GetChildren())
			{
				try
				{
					Type type = GetType(section.Path);
					obj.TryAdd(section.Key, section.Get(type));
				}
				catch (ArgumentException)
				{
					obj.TryAdd(section.Key, ToUntyped(section));
				}
				catch
				{
					continue;
				}
			}
			
			return obj;
		}

		/// <summary>
		/// Transform the configuration section in nested expando objects.
		/// </summary>
		/// <param name="config">The section to convert</param>
		/// <returns>The converted section</returns>
		private static object ToUntyped(IConfigurationSection config)
		{
			ExpandoObject obj = new();

			foreach (IConfigurationSection section in config.GetChildren())
			{
				obj.TryAdd(section.Key, ToUntyped(section));
			}

			if (!obj.Any())
				return config.Value;
			return obj;
		}
	}
}