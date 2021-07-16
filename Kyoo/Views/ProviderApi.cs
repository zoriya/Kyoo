using System.Threading.Tasks;
using Kyoo.CommonApi;
using Kyoo.Controllers;
using Kyoo.Models;
using Kyoo.Models.Options;
using Kyoo.Models.Permissions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kyoo.Api
{
	[Route("api/provider")]
	[Route("api/providers")]
	[ApiController]
	[PartialPermission(nameof(ProviderApi))]
	public class ProviderApi : CrudApi<Provider>
	{
		private readonly IThumbnailsManager _thumbnails;
		private readonly ILibraryManager _libraryManager;
		private readonly IFileManager _files;
		
		public ProviderApi(ILibraryManager libraryManager,
			IOptions<BasicOptions> options,
			IFileManager files,
			IThumbnailsManager thumbnails)
			: base(libraryManager.ProviderRepository, options.Value.PublicUrl)
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
			return _files.FileResult(await _thumbnails.GetLogo(provider));
		}
		
		[HttpGet("{slug}/logo")]
		public async Task<IActionResult> GetLogo(string slug)
		{
			Provider provider = await _libraryManager.GetOrDefault<Provider>(slug);
			if (provider == null)
				return NotFound();
			return _files.FileResult(await _thumbnails.GetLogo(provider));
		}
	}
}