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
				return BadRequest(new {Error = ex.Message});
			}
		}
	}
}