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
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace Kyoo.Authentication.Models.DTO;

public class JwtProfile
{
	public string? Sub { get; set; }
	public string? Uid
	{
		set => Sub ??= value;
	}
	public string? Id
	{
		set => Sub ??= value;
	}
	public string? Guid
	{
		set => Sub ??= value;
	}

	public string? Username { get; set; }
	public string? Name
	{
		set => Username ??= value;
	}

	public string? Email { get; set; }

	public JsonObject? Account
	{
		set
		{
			if (value is null)
				return;
			// simkl store their ids there.
			Sub ??= value["id"]?.ToString();
		}
	}

	public JsonObject? User
	{
		set
		{
			if (value is null)
				return;
			// trakt store their name there (they also store name but that's not the same).
			Username ??= value["username"]?.ToString();
			// simkl store their name there.
			Username ??= value["name"]?.ToString();

			Sub ??= value["ids"]?["uuid"]?.ToString();
		}
	}

	[JsonExtensionData]
	public Dictionary<string, object> Extra { get; set; }
}
