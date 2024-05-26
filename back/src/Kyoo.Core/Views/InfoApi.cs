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
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Authentication.Models;
using Kyoo.Core.Controllers;
using Microsoft.AspNetCore.Mvc;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Authentication.Views;

/// <summary>
/// Info about the current instance
/// </summary>
[ApiController]
[Route("info")]
[ApiDefinition("Info", Group = UsersGroup)]
public class InfoApi(PermissionOption options, MiscRepository info) : ControllerBase
{
	public async Task<ActionResult<ServerInfo>> GetInfo()
	{
		return Ok(
			new ServerInfo()
			{
				AllowGuests = options.Default.Any(),
				RequireVerification = options.RequireVerification,
				GuestPermissions = options.Default.ToList(),
				PublicUrl = options.PublicUrl,
				Oidc = options
					.OIDC.Select(x => new KeyValuePair<string, OidcInfo>(
						x.Key,
						new() { DisplayName = x.Value.DisplayName, LogoUrl = x.Value.LogoUrl, }
					))
					.ToDictionary(x => x.Key, x => x.Value),
				SetupStatus = await info.GetSetupStep(),
			}
		);
	}
}
