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
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Core.Models.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kyoo.Core.Api
{
	[Route("api/item")]
	[Route("api/items")]
	[ApiController]
	[ResourceView]
	public class LibraryItemApi : ControllerBase
	{
		private readonly ILibraryItemRepository _libraryItems;
		private readonly Uri _baseURL;

		public LibraryItemApi(ILibraryItemRepository libraryItems, IOptions<BasicOptions> options)
		{
			_libraryItems = libraryItems;
			_baseURL = options.Value.PublicUrl;
		}

		[HttpGet]
		[Permission(nameof(LibraryItemApi), Kind.Read)]
		public async Task<ActionResult<Page<LibraryItem>>> GetAll([FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 50)
		{
			try
			{
				ICollection<LibraryItem> resources = await _libraryItems.GetAll(
					ApiHelper.ParseWhere<LibraryItem>(where),
					new Sort<LibraryItem>(sortBy),
					new Pagination(limit, afterID));

				return new Page<LibraryItem>(resources,
					new Uri(_baseURL, Request.Path),
					Request.Query.ToDictionary(x => x.Key, x => x.Value.ToString(), StringComparer.InvariantCultureIgnoreCase),
					limit);
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}
	}
}
