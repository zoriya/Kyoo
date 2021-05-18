using System;
using System.Collections.Generic;
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

		/// <inheritdoc />
		public async Task EditValue(string path, object value)
		{
			path = path.Replace("__", ":");
			if (!_references.TryGetValue(path, out Type type))
				throw new ItemNotFoundException($"No configuration exists for the name: {path}");
			
			ExpandoObject config = ToObject(_configuration);
			IDictionary<string, object> configDic = config;
			// TODO validate the type
			configDic[path] = value;
			JObject obj = JObject.FromObject(config);
			// TODO allow path to change
			await using StreamWriter writer = new("settings.json");
			await writer.WriteAsync(obj.ToString());
		}
		
		/// <summary>
		/// Transform a configuration to a strongly typed object (the root configuration is an <see cref="ExpandoObject"/>
		/// but child elements are using strong types.
		/// </summary>
		/// <param name="config">The configuration to transform</param>
		/// <returns>A strongly typed representation of the configuration.</returns>
		private ExpandoObject ToObject(IConfiguration config)
		{
			ExpandoObject obj = new();

			foreach (IConfigurationSection section in config.GetChildren())
			{
				if (!_references.TryGetValue(section.Path, out Type type))
					continue;
				obj.TryAdd(section.Key, section.Get(type));
			}
			
			return obj;
		}
	}
}