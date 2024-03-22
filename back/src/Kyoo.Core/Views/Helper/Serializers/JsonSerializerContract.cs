// // Kyoo - A portable and vast media library solution.
// // Copyright (c) Kyoo.
// //
// // See AUTHORS.md and LICENSE file in the project root for full license information.
// //
// // Kyoo is free software: you can redistribute it and/or modify
// // it under the terms of the GNU General Public License as published by
// // the Free Software Foundation, either version 3 of the License, or
// // any later version.
// //
// // Kyoo is distributed in the hope that it will be useful,
// // but WITHOUT ANY WARRANTY; without even the implied warranty of
// // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// // GNU General Public License for more details.
// //
// // You should have received a copy of the GNU General Public License
// // along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
//
// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Net.Http.Formatting;
// using System.Reflection;
// using Kyoo.Abstractions.Models;
// using Kyoo.Abstractions.Models.Attributes;
// using Microsoft.AspNetCore.Http;
// using static System.Text.Json.JsonNamingPolicy;
//
// namespace Kyoo.Core.Api
// {
// 	/// <summary>
// 	/// A custom json serializer that respects <see cref="SerializeIgnoreAttribute"/> and
// 	/// <see cref="DeserializeIgnoreAttribute"/>. It also handle <see cref="LoadableRelationAttribute"/> via the
// 	/// <c>fields</c> query parameter and <see cref="IThumbnails"/> items.
// 	/// </summary>
// 	public class JsonSerializerContract(IHttpContextAccessor? httpContextAccessor, MediaTypeFormatter formatter)
// 		: JsonContractResolver(formatter)
// 	{
// 		/// <inheritdoc />
// 		protected override JsonProperty CreateProperty(
// 			MemberInfo member,
// 			MemberSerialization memberSerialization
// 		)
// 		{
// 			JsonProperty property = base.CreateProperty(member, memberSerialization);
//
// 			LoadableRelationAttribute? relation =
// 				member.GetCustomAttribute<LoadableRelationAttribute>();
// 			if (relation != null)
// 			{
// 				if (httpContextAccessor != null)
// 				{
// 					property.ShouldSerialize = _ =>
// 					{
// 						if (
// 							httpContextAccessor.HttpContext!.Items["fields"]
// 							is not ICollection<string> fields
// 						)
// 							return false;
// 						return fields.Contains(member.Name);
// 					};
// 				}
// 				else
// 					property.ShouldSerialize = _ => true;
// 			}
// 			return property;
// 		}
// 	}
// }
