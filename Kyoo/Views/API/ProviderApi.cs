using System.Collections.Generic;
using Kyoo.CommonApi;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Kyoo.Api
{
	[Route("api/provider")]
	[Route("api/providers")]
	[ApiController]
	public class ProviderAPI : CrudApi<ProviderID>
	{
		private readonly ILibraryManager _libraryManager;
		
		public ProviderAPI(ILibraryManager libraryManager, IConfiguration config)
			: base(libraryManager.ProviderRepository, config)
		{
			_libraryManager = libraryManager;
		}
	}
}