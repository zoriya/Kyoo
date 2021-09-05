using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Utils;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;

namespace Kyoo.Core.Api
{
	public class JsonPropertyIgnorer : CamelCasePropertyNamesContractResolver
	{
		private int _depth = -1;
		private string _host;

		public JsonPropertyIgnorer(string host)
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
