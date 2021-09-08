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
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Abstractions.Models.Permissions;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Core.Api
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
		/// The configuration manager used to retrieve and edit configuration values (while being type safe).
		/// </summary>
		private readonly IConfigurationManager _manager;

		/// <summary>
		/// Create a new <see cref="ConfigurationApi"/> using the given configuration.
		/// </summary>
		/// <param name="manager">The configuration manager used to retrieve and edit configuration values</param>
		public ConfigurationApi(IConfigurationManager manager)
		{
			_manager = manager;
		}

		/// <summary>
		/// Get a permission from it's slug.
		/// </summary>
		/// <param name="slug">The permission to retrieve. You can use ':' or "__" to get a child value.</param>
		/// <returns>The associate value or list of values.</returns>
		/// <response code="200">Return the configuration value or the list of configurations</response>
		/// <response code="404">No configuration exists for the given slug</response>
		[HttpGet("{slug}")]
		[Permission(nameof(ConfigurationApi), Kind.Read, Group.Admin)]
		public ActionResult<object> GetConfiguration(string slug)
		{
			try
			{
				return _manager.GetValue(slug);
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
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
		[Permission(nameof(ConfigurationApi), Kind.Write, Group.Admin)]
		public async Task<ActionResult<object>> EditConfiguration(string slug, [FromBody] object newValue)
		{
			try
			{
				await _manager.EditValue(slug, newValue);
				return newValue;
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
			catch (ArgumentException ex)
			{
				return BadRequest(ex.Message);
			}
		}
	}
}
