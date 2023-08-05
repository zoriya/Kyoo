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
using Kyoo.Abstractions.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Kyoo.Core.Api
{
	public class ImageConverter : JsonConverter<Image>
	{
		/// <inheritdoc />
		public override void WriteJson(JsonWriter writer, Image value, JsonSerializer serializer)
		{
			JObject obj = JObject.FromObject(value, serializer);
			obj.WriteTo(writer);
		}

		/// <inheritdoc />
		public override Image ReadJson(JsonReader reader,
			Type objectType,
			Image existingValue,
			bool hasExistingValue,
			JsonSerializer serializer)
		{
			throw new NotImplementedException();
		}
	}
}
