using System.Threading.Tasks;
using Kyoo.CommonApi;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Kyoo.Api
{
	[Route("api/provider")]
	[Route("api/providers")]
	[ApiController]
	public class ProviderAPI : CrudApi<Provider>
	{
		private readonly IThumbnailsManager _thumbnails;
		private readonly ILibraryManager _libraryManager;
		private readonly IFileManager _files;
		
		public ProviderAPI(ILibraryManager libraryManager,
			IConfiguration config,
			IFileManager files,
			IThumbnailsManager thumbnails)
			: base(libraryManager.ProviderRepository, config)
		{
			_libraryManager = libraryManager;
			_files = files;
			_thumbnails = thumbnails;
		}
		
		[HttpGet("{id:int}/logo")]
		public async Task<IActionResult> GetLogo(int id)
		{
			Provider provider = await _libraryManager.GetOrDefault<Provider>(id);
			if (provider == null)
				return NotFound();
			return _files.FileResult(await _thumbnails.GetProviderLogo(provider));
		}
		
		[HttpGet("{slug}/logo")]
		public async Task<IActionResult> GetLogo(string slug)
		{
			Provider provider = await _libraryManager.GetOrDefault<Provider>(slug);
			if (provider == null)
				return NotFound();
			return _files.FileResult(await _thumbnails.GetProviderLogo(provider));
		}
	}
}