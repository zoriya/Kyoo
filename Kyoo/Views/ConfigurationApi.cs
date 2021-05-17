using System;
using System.Collections.Generic;
using System.Linq;
using Kyoo.Models;
using Kyoo.Models.Permissions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Kyoo.Api
{
	/// <summary>
	/// An API to retrieve or edit configuration settings
	/// </summary>
	[Route("api/config")]
	[Route("api/configuration")]
	[ApiController]
	public class ConfigurationApi : Controller
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
		public ConfigurationApi(IConfiguration configuration, IEnumerable<ConfigurationReference> references)
		{
			_configuration = configuration;
			_references = references.ToDictionary(x => x.Path, x => x.Type, StringComparer.OrdinalIgnoreCase);
		}

		/// <summary>
		/// Get a permission from it's slug.
		/// </summary>
		/// <param name="slug">The permission to retrieve. You can use ':' or "__" to get a child value.</param>
		/// <returns>The associate value or list of values.</returns>
		/// <response code="200">Return the configuration value or the list of configurations</response>
		/// <response code="404">No configuration exists for the given slug</response>
		[HttpGet("{slug}")]
		[Permission(nameof(ConfigurationApi), Kind.Admin)]
		public ActionResult<object> GetConfiguration(string slug)
		{
			slug = slug.Replace("__", ":");
			// TODO handle lists and dictionaries.
			if (!_references.TryGetValue(slug, out Type type))
				return NotFound();
			object ret = _configuration.GetValue(type, slug);
			if (ret != null)
				return ret;
			object option = Activator.CreateInstance(type);
			_configuration.Bind(slug, option);
			return option;
		}

		/// <summary>
		/// Edit a permission from it's slug.
		/// </summary>
		/// <param name="slug">The permission to edit. You can use ':' or "__" to get a child value.</param>
		/// <param name="newValue">The new value of the configuration</param>
		/// <returns>The edited value.</returns>
		/// <response code="200">Return the edited value</response>
		/// <response code="404">No configuration exists for the given slug</response>
		[HttpPut("{slug}")]
		[Permission(nameof(ConfigurationApi), Kind.Admin)]
		public ActionResult<object> EditConfiguration(string slug, [FromBody] object newValue)
		{
			slug = slug.Replace("__", ":");
			if (!_references.TryGetValue(slug, out Type type))
				return NotFound();
			// object ret = _configuration.(type, slug);
			// if (ret != null)
			// 	return ret;
			// object option = Activator.CreateInstance(type);
			// _configuration.Bind(slug, option);
			return newValue;
		}
	}
}