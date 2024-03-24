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
using System.ComponentModel;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Serialization.Metadata;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Microsoft.AspNetCore.Http;
using static System.Text.Json.JsonNamingPolicy;

namespace Kyoo.Utils;


public class TypeConverterJsonAdapter : JsonConverter<object>
{
	public override object Read(
		ref Utf8JsonReader reader,
		Type typeToConvert,
		JsonSerializerOptions options
	)
	{
		TypeConverter converter = TypeDescriptor.GetConverter(typeToConvert);
		string? text = reader.GetString();
		return converter.ConvertFromString(text);
	}

	public override void Write(
		Utf8JsonWriter writer,
		object objectToWrite,
		JsonSerializerOptions options
	)
	{
		var converter = TypeDescriptor.GetConverter(objectToWrite);
		var text = converter.ConvertToString(objectToWrite);
		writer.WriteStringValue(text);
	}

	public override bool CanConvert(Type typeToConvert)
	{
		var hasConverter = typeToConvert
			.GetCustomAttributes<TypeConverterAttribute>(inherit: true)
			.Any();
		return hasConverter;
	}
}
