using System.Reflection;
using Kyoo.Models.Attributes;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Kyoo.Controllers
{
	public class JsonPropertyIgnorer : CamelCasePropertyNamesContractResolver
	{
		protected override JsonProperty CreateProperty(MemberInfo member, MemberSerialization memberSerialization)
		{
			JsonProperty property = base.CreateProperty(member, memberSerialization);
			
			// TODO this get called only once and get cached.

			// if (member?.GetCustomAttributes<LoadableRelationAttribute>() != null)
			// 	property.NullValueHandling = NullValueHandling.Ignore;
			// if (member?.GetCustomAttributes<SerializeIgnoreAttribute>() != null)
			// 	property.ShouldSerialize = _ => false;
			// if (member?.GetCustomAttributes<DeserializeIgnoreAttribute>() != null)
			// 	property.ShouldDeserialize = _ => false;
			return property;
		}
	}
}