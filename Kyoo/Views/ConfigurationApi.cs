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
		private readonly IConfiguration _config;

		/// <summary>
		/// Create a new <see cref="ConfigurationApi"/> using the given configuration.
		/// </summary>
		/// <param name="config">The configuration to use.</param>
		public ConfigurationApi(IConfiguration config)
		{
			_config = config;
		}

		/// <summary>
		/// Get a permission from it's slug.
		/// </summary>
		/// <param name="slug">The permission to retrieve. You can use __ to get a child value.</param>
		/// <returns>The associate value or list of values.</returns>
		[HttpGet("{slug}")]
		[Permission(nameof(ConfigurationApi), Kind.Admin)]
		public ActionResult<object> GetConfiguration(string slug)
		{
			return _config[slug];
		}
	}
}