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
using System.Reflection;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// A custom json serializer that respects <see cref="SerializeIgnoreAttribute"/> and
	/// <see cref="DeserializeIgnoreAttribute"/>. It also handle <see cref="LoadableRelationAttribute"/> via the
	/// <c>fields</c> query parameter and <see cref="IThumbnails"/> items.
	/// </summary>
	public class JsonSerializerContract : CamelCasePropertyNamesContractResolver
	{
		/// <summary>
		/// The http context accessor used to retrieve the <c>fields</c> query parameter as well as the type of
		/// resource currently serializing.
		/// </summary>
		private readonly IHttpContextAccessor _httpContextAccessor;

		/// <summary>
		/// Create a new <see cref="JsonSerializerContract"/>.
		/// </summary>
		/// <param name="httpContextAccessor">The http context accessor to use.</param>
		public JsonSerializerContract(IHttpContextAccessor httpContextAccessor)
		{
			_httpContextAccessor = httpContextAccessor;
		}

		/// <inheritdoc />
		protected override JsonProperty CreateProperty(MemberInfo member, MemberSerialization memberSerialization)
		{
			JsonProperty property = base.CreateProperty(member, memberSerialization);

			LoadableRelationAttribute? relation = member.GetCustomAttribute<LoadableRelationAttribute>();
			if (relation != null)
			{
				property.ShouldSerialize = _ =>
				{
					ICollection<string> fields = (ICollection<string>)_httpContextAccessor.HttpContext!.Items["fields"]!;
					if (fields == null)
						return false;
					return fields.Contains(member.Name);
				};
			}

			if (member.GetCustomAttribute<SerializeIgnoreAttribute>() != null)
				property.ShouldSerialize = _ => false;
			if (member.GetCustomAttribute<DeserializeIgnoreAttribute>() != null)
				property.ShouldDeserialize = _ => false;
			return property;
		}
	}
}
