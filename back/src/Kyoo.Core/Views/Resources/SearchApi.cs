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
	/// An endpoint to search for every resources of kyoo. Searching for only a specific type of resource
	/// is available on the said endpoint.
	/// </summary>
	[Route("search/{query}")]
	[ApiController]
	[ResourceView]
	[ApiDefinition("Search", Group = ResourcesGroup)]
	public class SearchApi : ControllerBase
	{
		/// <summary>
		/// The library manager used to modify or retrieve information in the data store.
		/// </summary>
		private readonly ILibraryManager _libraryManager;

		/// <summary>
		/// Create a new <see cref="SearchApi"/>.
		/// </summary>
		/// <param name="libraryManager">The library manager used to interact with the data store.</param>
		public SearchApi(ILibraryManager libraryManager)
		{
			_libraryManager = libraryManager;
		}

		/// <summary>
		/// Search collections
		/// </summary>
		/// <remarks>
		/// Search for collections
		/// </remarks>
		/// <param name="query">The query to search for.</param>
		/// <param name="fields">The aditional fields to include in the result.</param>
		/// <returns>A list of collections found for the specified query.</returns>
		[HttpGet("collections")]
		[HttpGet("collection", Order = AlternativeRoute)]
		[Permission(nameof(Collection), Kind.Read)]
		[ApiDefinition("Collections")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		public Task<ICollection<Collection>> SearchCollections(string query, [FromQuery] Include<Collection> fields)
		{
			return _libraryManager.Collections.Search(query);
		}

		/// <summary>
		/// Search shows
		/// </summary>
		/// <remarks>
		/// Search for shows
		/// </remarks>
		/// <param name="query">The query to search for.</param>
		/// <param name="fields">The aditional fields to include in the result.</param>
		/// <returns>A list of shows found for the specified query.</returns>
		[HttpGet("shows")]
		[HttpGet("show", Order = AlternativeRoute)]
		[Permission(nameof(Show), Kind.Read)]
		[ApiDefinition("Shows")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		public Task<ICollection<Show>> SearchShows(string query, [FromQuery] Include<Show> fields)
		{
			return _libraryManager.Shows.Search(query);
		}

		/// <summary>
		/// Search items
		/// </summary>
		/// <remarks>
		/// Search for items
		/// </remarks>
		/// <param name="query">The query to search for.</param>
		/// <param name="fields">The aditional fields to include in the result.</param>
		/// <returns>A list of items found for the specified query.</returns>
		[HttpGet("items")]
		[HttpGet("item", Order = AlternativeRoute)]
		[Permission(nameof(Show), Kind.Read)]
		[ApiDefinition("Items")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		public Task<ICollection<LibraryItem>> SearchItems(string query, [FromQuery] Include<LibraryItem> fields)
		{
			return _libraryManager.LibraryItems.Search(query);
		}

		/// <summary>
		/// Search episodes
		/// </summary>
		/// <remarks>
		/// Search for episodes
		/// </remarks>
		/// <param name="query">The query to search for.</param>
		/// <param name="fields">The aditional fields to include in the result.</param>
		/// <returns>A list of episodes found for the specified query.</returns>
		[HttpGet("episodes")]
		[HttpGet("episode", Order = AlternativeRoute)]
		[Permission(nameof(Episode), Kind.Read)]
		[ApiDefinition("Episodes")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		public Task<ICollection<Episode>> SearchEpisodes(string query, [FromQuery] Include<Episode> fields)
		{
			return _libraryManager.Episodes.Search(query);
		}

		/// <summary>
		/// Search staff
		/// </summary>
		/// <remarks>
		/// Search for staff
		/// </remarks>
		/// <param name="query">The query to search for.</param>
		/// <param name="fields">The aditional fields to include in the result.</param>
		/// <returns>A list of staff members found for the specified query.</returns>
		[HttpGet("staff")]
		[HttpGet("person", Order = AlternativeRoute)]
		[HttpGet("people", Order = AlternativeRoute)]
		[Permission(nameof(People), Kind.Read)]
		[ApiDefinition("Staff")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		public Task<ICollection<People>> SearchPeople(string query, [FromQuery] Include<People> fields)
		{
			return _libraryManager.People.Search(query);
		}

		/// <summary>
		/// Search studios
		/// </summary>
		/// <remarks>
		/// Search for studios
		/// </remarks>
		/// <param name="query">The query to search for.</param>
		/// <param name="fields">The aditional fields to include in the result.</param>
		/// <returns>A list of studios found for the specified query.</returns>
		[HttpGet("studios")]
		[HttpGet("studio", Order = AlternativeRoute)]
		[Permission(nameof(Studio), Kind.Read)]
		[ApiDefinition("Studios")]
		[ProducesResponseType(StatusCodes.Status200OK)]
		public Task<ICollection<Studio>> SearchStudios(string query, [FromQuery] Include<Studio> fields)
		{
			return _libraryManager.Studios.Search(query);
		}
	}
}
