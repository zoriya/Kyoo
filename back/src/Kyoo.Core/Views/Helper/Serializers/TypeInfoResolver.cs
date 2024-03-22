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
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Serialization.Metadata;
using Kyoo.Abstractions.Models;
using static System.Text.Json.JsonNamingPolicy;

namespace Kyoo.Core.Api;

public class PolymorphicTypeResolver : DefaultJsonTypeInfoResolver
{
	private static readonly IList<JsonDerivedType> _types = AppDomain
		.CurrentDomain.GetAssemblies()
		.SelectMany(s => s.GetTypes())
		.Where(p => p.IsAssignableTo(typeof(IResource)) && p.IsClass)
		.Select(x => new JsonDerivedType(x, CamelCase.ConvertName(x.Name)))
		.ToList();

	public override JsonTypeInfo GetTypeInfo(Type type, JsonSerializerOptions options)
	{
		JsonTypeInfo jsonTypeInfo = base.GetTypeInfo(type, options);

		if (
			jsonTypeInfo.Type.IsAssignableTo(typeof(IResource))
			&& jsonTypeInfo.Properties.All(x => x.Name != "kind")
		)
		{
			jsonTypeInfo.PolymorphismOptions = new JsonPolymorphismOptions
			{
				TypeDiscriminatorPropertyName = "kind",
				IgnoreUnrecognizedTypeDiscriminators = true,
				UnknownDerivedTypeHandling =
					JsonUnknownDerivedTypeHandling.FallBackToNearestAncestor,
				DerivedTypes = { },
			};
			Console.WriteLine(string.Join(",", _types.Select(x => x.DerivedType.Name)));
			foreach (JsonDerivedType derived in _types)
				jsonTypeInfo.PolymorphismOptions.DerivedTypes.Add(derived);
		}

		return jsonTypeInfo;
	}
}
