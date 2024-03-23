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
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Microsoft.AspNetCore.Http;
using static System.Text.Json.JsonNamingPolicy;

namespace Kyoo.Utils;

public class JsonKindResolver : DefaultJsonTypeInfoResolver
{
	public override JsonTypeInfo GetTypeInfo(Type type, JsonSerializerOptions options)
	{
		JsonTypeInfo jsonTypeInfo = base.GetTypeInfo(type, options);

		if (jsonTypeInfo.Type.GetCustomAttribute<OneOfAttribute>() != null)
		{
			jsonTypeInfo.PolymorphismOptions = new()
			{
				TypeDiscriminatorPropertyName = "kind",
				IgnoreUnrecognizedTypeDiscriminators = true,
				DerivedTypes = { },
			};
			IEnumerable<Type> derived = AppDomain
				.CurrentDomain.GetAssemblies()
				.SelectMany(s => s.GetTypes())
				.Where(p => type.IsAssignableFrom(p) && p.IsClass);
			foreach (Type der in derived)
			{
				jsonTypeInfo.PolymorphismOptions.DerivedTypes.Add(
					new JsonDerivedType(der, CamelCase.ConvertName(der.Name))
				);
			}
		}
		else if (
			jsonTypeInfo.Type.IsAssignableTo(typeof(IResource))
			&& jsonTypeInfo.Properties.All(x => x.Name != "kind")
		)
		{
			jsonTypeInfo.PolymorphismOptions = new JsonPolymorphismOptions
			{
				TypeDiscriminatorPropertyName = "kind",
				IgnoreUnrecognizedTypeDiscriminators = true,
				DerivedTypes =
				{
					new JsonDerivedType(
						jsonTypeInfo.Type,
						CamelCase.ConvertName(jsonTypeInfo.Type.Name)
					),
				},
			};
		}

		return jsonTypeInfo;
	}
}
