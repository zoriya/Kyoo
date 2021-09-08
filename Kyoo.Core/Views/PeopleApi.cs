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
	[Route("api/people")]
	[ApiController]
	[PartialPermission(nameof(PeopleApi))]
	public class PeopleApi : CrudApi<People>
	{
		private readonly ILibraryManager _libraryManager;
		private readonly IFileSystem _files;
		private readonly IThumbnailsManager _thumbs;

		public PeopleApi(ILibraryManager libraryManager,
			IOptions<BasicOptions> options,
			IFileSystem files,
			IThumbnailsManager thumbs)
			: base(libraryManager.PeopleRepository, options.Value.PublicUrl)
		{
			_libraryManager = libraryManager;
			_files = files;
			_thumbs = thumbs;
		}

		[HttpGet("{id:int}/role")]
		[HttpGet("{id:int}/roles")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Page<PeopleRole>>> GetRoles(int id,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 20)
		{
			try
			{
				ICollection<PeopleRole> resources = await _libraryManager.GetRolesFromPeople(id,
					ApiHelper.ParseWhere<PeopleRole>(where),
					new Sort<PeopleRole>(sortBy),
					new Pagination(limit, afterID));

				return Page(resources, limit);
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

		[HttpGet("{slug}/role")]
		[HttpGet("{slug}/roles")]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Page<PeopleRole>>> GetRoles(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 20)
		{
			try
			{
				ICollection<PeopleRole> resources = await _libraryManager.GetRolesFromPeople(slug,
					ApiHelper.ParseWhere<PeopleRole>(where),
					new Sort<PeopleRole>(sortBy),
					new Pagination(limit, afterID));

				return Page(resources, limit);
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

		[HttpGet("{id:int}/poster")]
		public async Task<IActionResult> GetPeopleIcon(int id)
		{
			People people = await _libraryManager.GetOrDefault<People>(id);
			if (people == null)
				return NotFound();
			return _files.FileResult(await _thumbs.GetImagePath(people, Images.Poster));
		}

		[HttpGet("{slug}/poster")]
		public async Task<IActionResult> GetPeopleIcon(string slug)
		{
			People people = await _libraryManager.GetOrDefault<People>(slug);
			if (people == null)
				return NotFound();
			return _files.FileResult(await _thumbs.GetImagePath(people, Images.Poster));
		}
	}
}
