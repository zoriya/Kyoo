using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Core.Models.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kyoo.Core.Api
{
	[Route("api/provider")]
	[Route("api/providers")]
	[ApiController]
	[PartialPermission(nameof(ProviderApi))]
	public class ProviderApi : CrudApi<Provider>
	{
		private readonly IThumbnailsManager _thumbnails;
		private readonly ILibraryManager _libraryManager;
		private readonly IFileSystem _files;
		
		public ProviderApi(ILibraryManager libraryManager,
			IOptions<BasicOptions> options,
			IFileSystem files,
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
			return _files.FileResult(await _thumbnails.GetImagePath(provider, Images.Logo));
		}
		
		[HttpGet("{slug}/logo")]
		public async Task<IActionResult> GetLogo(string slug)
		{
			Provider provider = await _libraryManager.GetOrDefault<Provider>(slug);
			if (provider == null)
				return NotFound();
			return _files.FileResult(await _thumbnails.GetImagePath(provider, Images.Logo));
		}
	}
}