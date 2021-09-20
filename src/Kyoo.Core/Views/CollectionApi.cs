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
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// Information about one or multiple <see cref="Collection"/>.
	/// </summary>
	[Route("api/collections")]
	[Route("api/collection", Order = AlternativeRoute)]
	[ApiController]
	[PartialPermission(nameof(CollectionApi))]
	public class CollectionApi : CrudApi<Collection>
	{
		/// <summary>
		/// The library manager used to modify or retrieve information about the data store.
		/// </summary>
		private readonly ILibraryManager _libraryManager;

		/// <summary>
		/// The file manager used to send images.
		/// </summary>
		private readonly IFileSystem _files;

		/// <summary>
		/// The thumbnail manager used to retrieve images paths.
		/// </summary>
		private readonly IThumbnailsManager _thumbs;

		public CollectionApi(ILibraryManager libraryManager,
			IFileSystem files,
			IThumbnailsManager thumbs,
			IOptions<BasicOptions> options)
			: base(libraryManager.CollectionRepository, options.Value.PublicUrl)
		{
			_libraryManager = libraryManager;
			_files = files;
			_thumbs = thumbs;
		}

		/// <summary>
		/// Lists <see cref="Show"/> that are contained in the <see cref="Collection"/> with id <paramref name="id"/>.
		/// </summary>
		/// <param name="id">The ID of the <see cref="Collection"/>.</param>
		/// <param name="sortBy">A key to sort shows by. See <see cref="Sort{T}"/> for more information.</param>
		/// <param name="afterID">An optional show's ID to start the query from this specific item.</param>
		/// <param name="where">
		/// An optional list of filters. See <see cref="ApiHelper.ParseWhere{T}"/> for more details.
		/// </param>
		/// <param name="limit">The number of shows to return.</param>
		/// <returns>A page of shows.</returns>
		/// <response code="200">A page of shows.</response>
		/// <response code="400"><paramref name="sortBy"/> or <paramref name="where"/> is invalid.</response>
		/// <response code="404">No collection with the ID <paramref name="id"/> could be found.</response>
		[HttpGet("{id:int}/shows")]
		[HttpGet("{id:int}/show", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Page<Show>>> GetShows(int id,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Show> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Show>(where, x => x.Collections.Any(y => y.ID == id)),
					new Sort<Show>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault<Collection>(id) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{slug}/shows")]
		[HttpGet("{slug}/show", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Page<Show>>> GetShows(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Show> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Show>(where, x => x.Collections.Any(y => y.Slug == slug)),
					new Sort<Show>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault<Collection>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{id:int}/libraries")]
		[HttpGet("{id:int}/library", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Page<Library>>> GetLibraries(int id,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Library> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Library>(where, x => x.Collections.Any(y => y.ID == id)),
					new Sort<Library>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault<Collection>(id) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{slug}/libraries")]
		[HttpGet("{slug}/library", Order = AlternativeRoute)]
		[PartialPermission(Kind.Read)]
		public async Task<ActionResult<Page<Library>>> GetLibraries(string slug,
			[FromQuery] string sortBy,
			[FromQuery] int afterID,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] int limit = 30)
		{
			try
			{
				ICollection<Library> resources = await _libraryManager.GetAll(
					ApiHelper.ParseWhere<Library>(where, x => x.Collections.Any(y => y.Slug == slug)),
					new Sort<Library>(sortBy),
					new Pagination(limit, afterID));

				if (!resources.Any() && await _libraryManager.GetOrDefault<Collection>(slug) == null)
					return NotFound();
				return Page(resources, limit);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { Error = ex.Message });
			}
		}

		[HttpGet("{slug}/poster")]
		public async Task<IActionResult> GetPoster(string slug)
		{
			try
			{
				Collection collection = await _libraryManager.Get<Collection>(slug);
				return _files.FileResult(await _thumbs.GetImagePath(collection, Images.Poster));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}

		[HttpGet("{slug}/logo")]
		public async Task<IActionResult> GetLogo(string slug)
		{
			try
			{
				Collection collection = await _libraryManager.Get<Collection>(slug);
				return _files.FileResult(await _thumbs.GetImagePath(collection, Images.Logo));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}

		[HttpGet("{slug}/backdrop")]
		[HttpGet("{slug}/thumbnail")]
		public async Task<IActionResult> GetBackdrop(string slug)
		{
			try
			{
				Collection collection = await _libraryManager.Get<Collection>(slug);
				return _files.FileResult(await _thumbs.GetImagePath(collection, Images.Thumbnail));
			}
			catch (ItemNotFoundException)
			{
				return NotFound();
			}
		}
	}
}
