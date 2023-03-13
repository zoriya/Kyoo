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
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// A base class to handle CRUD operations on a specific resource type <typeparamref name="T"/>.
	/// </summary>
	/// <typeparam name="T">The type of resource to make CRUD apis for.</typeparam>
	[ApiController]
	[ResourceView]
	public class CrudApi<T> : BaseApi
		where T : class, IResource
	{
		/// <summary>
		/// The repository of the resource, used to retrieve, save and do operations on the baking store.
		/// </summary>
		protected IRepository<T> Repository { get; }

		/// <summary>
		/// Create a new <see cref="CrudApi{T}"/> using the given repository and base url.
		/// </summary>
		/// <param name="repository">
		/// The repository to use as a baking store for the type <typeparamref name="T"/>.
		/// </param>
		public CrudApi(IRepository<T> repository)
		{
			Repository = repository;
		}

		/// <summary>
		/// Get item
		/// </summary>
		/// <remarks>
		/// Get a specific resource via it's ID or it's slug.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the resource to retrieve.</param>
		/// <returns>The retrieved resource.</returns>
		/// <response code="404">A resource with the given ID or slug does not exist.</response>
		[HttpGet("{identifier:id}")]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<T>> Get(Identifier identifier)
		{
			T ret = await identifier.Match(
				id => Repository.GetOrDefault(id),
				slug => Repository.GetOrDefault(slug)
			);
			if (ret == null)
				return NotFound();
			return ret;
		}

		/// <summary>
		/// Get count
		/// </summary>
		/// <remarks>
		/// Get the number of resources that match the filters.
		/// </remarks>
		/// <param name="where">A list of filters to respect.</param>
		/// <returns>How many resources matched that filter.</returns>
		/// <response code="400">Invalid filters.</response>
		[HttpGet("count")]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		public async Task<ActionResult<int>> GetCount([FromQuery] Dictionary<string, string> where)
		{
			return await Repository.GetCount(ApiHelper.ParseWhere<T>(where));
		}

		/// <summary>
		/// Get all
		/// </summary>
		/// <remarks>
		/// Get all resources that match the given filter.
		/// </remarks>
		/// <param name="sortBy">Sort information about the query (sort by, sort order).</param>
		/// <param name="where">Filter the returned items.</param>
		/// <param name="pagination">How many items per page should be returned, where should the page start...</param>
		/// <returns>A list of resources that match every filters.</returns>
		/// <response code="400">Invalid filters or sort information.</response>
		[HttpGet]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		public async Task<ActionResult<Page<T>>> GetAll(
			[FromQuery] string sortBy,
			[FromQuery] Dictionary<string, string> where,
			[FromQuery] Pagination pagination)
		{
			ICollection<T> resources = await Repository.GetAll(
				ApiHelper.ParseWhere<T>(where),
				Sort<T>.From(sortBy),
				pagination
			);

			return Page(resources, pagination.Count);
		}

		/// <summary>
		/// Create new
		/// </summary>
		/// <remarks>
		/// Create a new item and store it. You may leave the ID unspecified, it will be filed by Kyoo.
		/// </remarks>
		/// <param name="resource">The resource to create.</param>
		/// <returns>The created resource.</returns>
		/// <response code="400">The resource in the request body is invalid.</response>
		/// <response code="409">This item already exists (maybe a duplicated slug).</response>
		[HttpPost]
		[PartialPermission(Kind.Create)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status409Conflict, Type = typeof(ActionResult<>))]
		public async Task<ActionResult<T>> Create([FromBody] T resource)
		{
			return await Repository.Create(resource);
		}

		/// <summary>
		/// Edit
		/// </summary>
		/// <remarks>
		/// Edit an item. If the ID is specified it will be used to identify the resource.
		/// If not, the slug will be used to identify it.
		/// </remarks>
		/// <param name="resource">The resource to edit.</param>
		/// <returns>The edited resource.</returns>
		/// <response code="400">The resource in the request body is invalid.</response>
		/// <response code="404">No item found with the specified ID (or slug).</response>
		[HttpPut]
		[PartialPermission(Kind.Write)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<T>> Edit([FromBody] T resource)
		{
			if (resource.ID > 0)
				return await Repository.Edit(resource, true);

			T old = await Repository.Get(resource.Slug);
			resource.ID = old.ID;
			return await Repository.Edit(resource, true);
		}

		/// <summary>
		/// Patch
		/// </summary>
		/// <remarks>
		/// Edit only specified properties of an item. If the ID is specified it will be used to identify the resource.
		/// If not, the slug will be used to identify it.
		/// </remarks>
		/// <param name="resource">The resource to patch.</param>
		/// <returns>The edited resource.</returns>
		/// <response code="400">The resource in the request body is invalid.</response>
		/// <response code="404">No item found with the specified ID (or slug).</response>
		[HttpPatch]
		[PartialPermission(Kind.Write)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<ActionResult<T>> Patch([FromBody] T resource)
		{
			if (resource.ID > 0)
				return await Repository.Edit(resource, false);

			T old = await Repository.Get(resource.Slug);
			resource.ID = old.ID;
			return await Repository.Edit(resource, false);
		}

		/// <summary>
		/// Delete an item
		/// </summary>
		/// <remarks>
		/// Delete one item via it's ID or it's slug.
		/// </remarks>
		/// <param name="identifier">The ID or slug of the resource to delete.</param>
		/// <returns>The item has successfully been deleted.</returns>
		/// <response code="404">No item could be found with the given id or slug.</response>
		[HttpDelete("{identifier:id}")]
		[PartialPermission(Kind.Delete)]
		[ProducesResponseType(StatusCodes.Status204NoContent)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		public async Task<IActionResult> Delete(Identifier identifier)
		{
			await identifier.Match(
				id => Repository.Delete(id),
				slug => Repository.Delete(slug)
			);
			return NoContent();
		}

		/// <summary>
		/// Delete all where
		/// </summary>
		/// <remarks>
		/// Delete all items matching the given filters. If no filter is specified, delete all items.
		/// </remarks>
		/// <param name="where">The list of filters.</param>
		/// <returns>The item(s) has successfully been deleted.</returns>
		/// <response code="400">One or multiple filters are invalid.</response>
		[HttpDelete]
		[PartialPermission(Kind.Delete)]
		[ProducesResponseType(StatusCodes.Status204NoContent)]
		[ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(RequestError))]
		public async Task<IActionResult> Delete([FromQuery] Dictionary<string, string> where)
		{
			await Repository.DeleteAll(ApiHelper.ParseWhere<T>(where));
			return NoContent();
		}
	}
}
