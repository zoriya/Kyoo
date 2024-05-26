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

namespace Kyoo.Authentication.Models;

public class ServerInfo
{
	/// <summary>
	/// The list of oidc providers configured for this instance of kyoo.
	/// </summary>
	public Dictionary<string, OidcInfo> Oidc { get; set; }

	/// <summary>
	/// The url to reach the homepage of kyoo (add /api for the api).
	/// </summary>
	public string PublicUrl { get; set; }

	/// <summary>
	/// True if guest accounts are allowed on this instance.
	/// </summary>
	public bool AllowGuests { get; set; }

	/// <summary>
	/// True if new users needs to be verifed.
	/// </summary>
	public bool RequireVerification { get; set; }

	/// <summary>
	/// The list of permissions available for the guest account.
	/// </summary>
	public List<string> GuestPermissions { get; set; }

	/// <summary>
	/// Check if kyoo's setup is finished.
	/// </summary>
	public SetupStep SetupStatus { get; set; }
}

public class OidcInfo
{
	/// <summary>
	/// The name of this oidc service. Human readable.
	/// </summary>
	public string DisplayName { get; set; }

	/// <summary>
	/// A url returing a square logo for this provider.
	/// </summary>
	public string? LogoUrl { get; set; }
}

/// <summary>
/// Check if kyoo's setup is finished.
/// </summary>
public enum SetupStep
{
	/// <summary>
	/// No admin account exists, create an account before exposing kyoo to the internet!
	/// </summary>
	MissingAdminAccount,

	/// <summary>
	/// No video was registered on kyoo, have you configured the rigth library path?
	/// </summary>
	NoVideoFound,

	/// <summary>
	/// Setup finished!
	/// </summary>
	Done,
}
