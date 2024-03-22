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
using Newtonsoft.Json;
using NSwag;

namespace Kyoo.Swagger.Models;

/// <summary>
/// A class representing a group of tags in the <see cref="OpenApiDocument"/>
/// </summary>
public class TagGroups
{
	/// <summary>
	/// The name of the tag group.
	/// </summary>
	[JsonProperty(PropertyName = "name")]
	public string Name { get; set; }

	/// <summary>
	/// The list of tags in this group.
	/// </summary>
	[JsonProperty(PropertyName = "tags")]
	public List<string> Tags { get; set; }
}
