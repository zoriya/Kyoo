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
using System.Collections;
using System.Reflection;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Utils;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Kyoo.Core.Api
{
	public class JsonPropertyIgnorer : CamelCasePropertyNamesContractResolver
	{
		private int _depth = -1;
		private readonly Uri _host;

		public JsonPropertyIgnorer(Uri host)
		{
			_host = host;
		}

		protected override JsonProperty CreateProperty(MemberInfo member, MemberSerialization memberSerialization)
		{
			JsonProperty property = base.CreateProperty(member, memberSerialization);

			LoadableRelationAttribute relation = member.GetCustomAttribute<LoadableRelationAttribute>();
			if (relation != null)
			{
				if (relation.RelationID == null)
					property.ShouldSerialize = x => _depth == 0 && member.GetValue(x) != null;
				else
				{
					property.ShouldSerialize = x =>
					{
						if (_depth != 0)
							return false;
						if (member.GetValue(x) != null)
							return true;
						return x.GetType().GetProperty(relation.RelationID)?.GetValue(x) != null;
					};
				}
			}

			if (member.GetCustomAttribute<SerializeIgnoreAttribute>() != null)
				property.ShouldSerialize = _ => false;
			if (member.GetCustomAttribute<DeserializeIgnoreAttribute>() != null)
				property.ShouldDeserialize = _ => false;

			// TODO use http context to disable serialize as.
			// TODO check https://stackoverflow.com/questions/53288633/net-core-api-custom-json-resolver-based-on-request-values
			SerializeAsAttribute serializeAs = member.GetCustomAttribute<SerializeAsAttribute>();
			if (serializeAs != null)
				property.ValueProvider = new SerializeAsProvider(serializeAs.Format, _host);
			return property;
		}

		protected override JsonContract CreateContract(Type objectType)
		{
			JsonContract contract = base.CreateContract(objectType);
			if (Utility.GetGenericDefinition(objectType, typeof(Page<>)) == null
				&& !objectType.IsAssignableTo(typeof(IEnumerable))
				&& objectType.Name != "AnnotatedProblemDetails")
			{
				contract.OnSerializingCallbacks.Add((_, _) => _depth++);
				contract.OnSerializedCallbacks.Add((_, _) => _depth--);
			}

			return contract;
		}
	}
}
