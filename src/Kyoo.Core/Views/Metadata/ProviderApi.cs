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

using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Permissions;
using Microsoft.AspNetCore.Mvc;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// Information about one or multiple <see cref="Provider"/>.
	/// Providers are links to external websites or database.
	/// They are mostly linked to plugins that provide metadata from those websites.
	/// </summary>
	[Route("providers")]
	[Route("provider", Order = AlternativeRoute)]
	[ApiController]
	[ResourceView]
	[PartialPermission(nameof(Provider))]
	[ApiDefinition("Providers", Group = MetadataGroup)]
	public class ProviderApi : CrudThumbsApi<Provider>
	{
		/// <summary>
		/// Create a new <see cref="ProviderApi"/>.
		/// </summary>
		/// <param name="libraryManager">
		/// The library manager used to modify or retrieve information about the data store.
		/// </param>
		/// <param name="files">The file manager used to send images and fonts.</param>
		/// <param name="thumbnails">The thumbnail manager used to retrieve images paths.</param>
		public ProviderApi(ILibraryManager libraryManager,
			IFileSystem files,
			IThumbnailsManager thumbnails)
			: base(libraryManager.ProviderRepository, files, thumbnails)
		{ }
	}
}
