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
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Core.Models.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kyoo.Core.Api
{
	[Route("api/library")]
	[Route("api/libraries")]
	[ApiController]
	[PartialPermission(nameof(LibraryApi))]
	public class LibraryApi : CrudApi<Library>
	{
		private readonly ILibraryManager _libraryManager;
		private readonly ITaskManager _taskManager;

		public LibraryApi(ILibraryManager libraryManager, ITaskManager taskManager, IOptions<BasicOptions> options)
			: base(libraryManager.LibraryRepository, options.Value.PublicUrl)
		{
			_libraryManager = libraryManager;
			_taskManager = taskManager;
		}

		[PartialPermission(Kind.Create)]
		public override async Task<ActionResult<Library>> Create(Library resource)
		{
			ActionResult<Library> result = await base.Create(resource);
			if (result.Value != null)
			{
				_taskManager.StartTask("scan",
					new Progress<float>(),
					new Dictionary<string, object> { { "slug", result.Value.Slug } });
			}
			return result;
		}

		[HttpGet("{id:int}/show")]
		[HttpGet("{id:int}/shows")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Page<Show>>> GetShows(int id,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 50)
		{
			try
			{
				ICollection<Show> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Show>(where, x => x.Libraries.Any(y => y.ID == id)),
					new Sort<Show>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault<Library>(id) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{slug}/show")]
		[HttpGet("{slug}/shows")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Page<Show>>> GetShows(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 20)
		{
			try
			{
				ICollection<Show> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Show>(where, x => x.Libraries.Any(y => y.Slug == slug)),
					new Sort<Show>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault<Library>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{id:int}/collection")]
		[HttpGet("{id:int}/collections")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Page<Collection>>> GetCollections(int id,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 50)
		{
			try
			{
				ICollection<Collection> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Collection>(where, x => x.Libraries.Any(y => y.ID == id)),
					new Sort<Collection>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault<Library>(id) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{slug}/collection")]
		[HttpGet("{slug}/collections")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Page<Collection>>> GetCollections(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 20)
		{
			try
			{
				ICollection<Collection> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Collection>(where, x => x.Libraries.Any(y => y.Slug == slug)),
					new Sort<Collection>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault<Library>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{id:int}/item")]
		[HttpGet("{id:int}/items")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Page<LibraryItem>>> GetItems(int id,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 50)
		{
			try
			{
				ICollection<LibraryItem> resources = await _libraryManager.GetItemsFromLibrary(id,
					ApiHelper.ParseWhere<LibraryItem>(where),
					new Sort<LibraryItem>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault<Library>(id) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{slug}/item")]
		[HttpGet("{slug}/items")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Page<LibraryItem>>> GetItems(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 50)
		{
			try
			{
				ICollection<LibraryItem> resources = await _libraryManager.GetItemsFromLibrary(slug,
					ApiHelper.ParseWhere<LibraryItem>(where),
					new Sort<LibraryItem>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault<Library>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}
	}
}
