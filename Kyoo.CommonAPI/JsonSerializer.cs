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
			
			if (member?.GetCustomAttribute<LoadableRelationAttribute>() != null)
				property.NullValueHandling = NullValueHandling.Ignore;
			if (member?.GetCustomAttribute<SerializeIgnoreAttribute>() != null)
				property.ShouldSerialize = _ => false;
			if (member?.GetCustomAttribute<DeserializeIgnoreAttribute>() != null)
				property.ShouldDeserialize = _ => false;
			return property;
		}
	}
}