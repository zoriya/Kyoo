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
	/// List new items added to kyoo.
	/// </summary>
	[Route("news")]
	[Route("new", Order = AlternativeRoute)]
	[ApiController]
	[PartialPermission("LibraryItem")]
	[ApiDefinition("News", Group = ResourcesGroup)]
	public class NewsApi : CrudThumbsApi<INews>
	{
		public NewsApi(IRepository<INews> news, IThumbnailsManager thumbs)
			: base(news, thumbs) { }
	}
}
