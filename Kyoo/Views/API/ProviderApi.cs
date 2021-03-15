using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
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
		private readonly string _providerPath;
		
		public ProviderAPI(ILibraryManager libraryManager, IConfiguration config)
			: base(libraryManager.ProviderRepository, config)
		{
			_libraryManager = libraryManager;
			_providerPath = Path.GetFullPath(config.GetValue<string>("providerPath"));
		}
		
		[HttpGet("{id:int}/logo")]
		[Authorize(Policy="Read")]
		public async Task<IActionResult> GetLogo(int id)
		{
			string slug = (await _libraryManager.GetPeople(id)).Slug;
			return GetLogo(slug);
		}
		
		[HttpGet("{slug}/logo")]
		[Authorize(Policy="Read")]
		public IActionResult GetLogo(string slug)
		{
			string thumbPath = Path.GetFullPath(Path.Combine(_providerPath, slug + ".jpg"));
			if (!thumbPath.StartsWith(_providerPath) || !System.IO.File.Exists(thumbPath))
				return NotFound();

			return new PhysicalFileResult(Path.GetFullPath(thumbPath), "image/jpg");
		}
	}
}