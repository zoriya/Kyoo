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

using System.Threading.Tasks;
using Kyoo.Abstractions.Models.Attributes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// An API endpoint to check the health.
	/// </summary>
	[Route("health")]
	[ApiController]
	[ApiDefinition("Health")]
	public class Health : BaseApi
	{
		private readonly HealthCheckService _healthCheckService;

		/// <summary>
		/// Create a new <see cref="Health"/>.
		/// </summary>
		/// <param name="healthCheckService">The service to check health.</param>
		public Health(HealthCheckService healthCheckService)
		{
			_healthCheckService = healthCheckService;
		}

		/// <summary>
		/// Check if the api is ready to accept requests.
		/// </summary>
		/// <returns>A status indicating the health of the api.</returns>
		[HttpGet]
		[ProducesResponseType(StatusCodes.Status204NoContent)]
		[ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
		public async Task<IActionResult> CheckHealth()
		{
			IHeaderDictionary headers = HttpContext.Response.Headers;
			headers.CacheControl = "no-store, no-cache";
			headers.Pragma = "no-cache";
			headers.Expires = "Thu, 01 Jan 1970 00:00:00 GMT";

			HealthReport result = await _healthCheckService.CheckHealthAsync();
			return result.Status switch
			{
				HealthStatus.Healthy => NoContent(),
				HealthStatus.Unhealthy => NoContent(),
				HealthStatus.Degraded => StatusCode(StatusCodes.Status503ServiceUnavailable),
				_ => StatusCode(StatusCodes.Status500InternalServerError),
			};
		}
	}
}
