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
