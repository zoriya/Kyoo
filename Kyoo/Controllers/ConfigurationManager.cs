using System;
using System.Collections.Generic;
using System.Dynamic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Api;
using Kyoo.Models;
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
		public Task EditValue<T>(string path, T value)
		{
			return EditValue(path, value, typeof(T));
		}

		/// <inheritdoc />
		public async Task EditValue(string path, object value, Type type)
		{
			JObject obj = JObject.FromObject(ToObject(_configuration));
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
		private object ToObject(IConfiguration config)
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