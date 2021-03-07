using System;
using System.Collections;
using System.Reflection;
using Kyoo.Models;
using Kyoo.Models.Attributes;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Kyoo.Controllers
{
	public class JsonPropertyIgnorer : CamelCasePropertyNamesContractResolver
	{
		private int _depth = -1;
		
		protected override JsonProperty CreateProperty(MemberInfo member, MemberSerialization memberSerialization)
		{
			JsonProperty property = base.CreateProperty(member, memberSerialization);

			LoadableRelationAttribute relation = member?.GetCustomAttribute<LoadableRelationAttribute>();
			if (relation != null)
			{
				if (relation.RelationID == null)
					property.ShouldSerialize = x => _depth == 0 && member.GetValue(x) != null;
				else
					property.ShouldSerialize = x =>
					{
						if (_depth != 0)
							return false;
						if (member.GetValue(x) != null)
							return true;
						return x.GetType().GetProperty(relation.RelationID)?.GetValue(x) != null;
					};
			}

			if (member?.GetCustomAttribute<SerializeIgnoreAttribute>() != null)
				property.ShouldSerialize = _ => false;
			if (member?.GetCustomAttribute<DeserializeIgnoreAttribute>() != null)
				property.ShouldDeserialize = _ => false;
			return property;
		}

		protected override JsonContract CreateContract(Type objectType)
		{
			JsonContract contract = base.CreateContract(objectType);
			if (Utility.GetGenericDefinition(objectType, typeof(Page<>)) == null
				&& !objectType.IsAssignableTo(typeof(IEnumerable)))
			{
				contract.OnSerializingCallbacks.Add((_, _) => _depth++);
				contract.OnSerializedCallbacks.Add((_, _) => _depth--);
			}

			return contract;
		}
	}
}