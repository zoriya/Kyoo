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

using System;
using System.Collections.Generic;
using System.Reflection;
using System.Text.Json;
using Kyoo.Abstractions.Models;

namespace Kyoo.Models;

public class Patch<T> : Dictionary<string, JsonDocument>
	where T : class, IResource
{
	public Guid? Id => this.GetValueOrDefault(nameof(IResource.Id))?.Deserialize<Guid>();

	public string? Slug => this.GetValueOrDefault(nameof(IResource.Slug))?.Deserialize<string>();

	public T Apply(T current)
	{
		foreach ((string property, JsonDocument value) in this)
		{
			PropertyInfo prop = typeof(T).GetProperty(
				property,
				BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance
			)!;
			prop.SetValue(current, value.Deserialize(prop.PropertyType));
		}
		return current;
	}
}
