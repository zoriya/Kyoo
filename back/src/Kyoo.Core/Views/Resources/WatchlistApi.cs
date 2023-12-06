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

using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// List new items added to kyoo.
	/// </summary>
	[Route("watchlist")]
	[ApiController]
	[PartialPermission("LibraryItem")]
	[ApiDefinition("News", Group = ResourcesGroup)]
	public class WatchlistApi : BaseApi
	{
		private readonly IWatchStatusRepository _repository;

		public WatchlistApi(IWatchStatusRepository repository)
		{
			_repository = repository;
		}

		/// <summary>
		/// Get all
		/// </summary>
		/// <remarks>
		/// Get all resources that match the given filter.
		/// </remarks>
		/// <param name="filter">Filter the returned items.</param>
		/// <param name="pagination">How many items per page should be returned, where should the page start...</param>
		/// <param name="fields">The aditional fields to include in the result.</param>
		/// <returns>A list of resources that match every filters.</returns>
		/// <response code="400">Invalid filters or sort information.</response>
		[HttpGet]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		public async Task<ActionResult<Page<IWatchlist>>> GetAll(
			[FromQuery] Filter<IWatchlist>? filter,
			[FromQuery] Pagination pagination,
			[FromQuery] Include<IWatchlist>? fields)
		{
			ICollection<IWatchlist> resources = await _repository.GetAll(
				filter,
				fields,
				pagination
			);

			return Page(resources, pagination.Limit);
		}
	}
}
