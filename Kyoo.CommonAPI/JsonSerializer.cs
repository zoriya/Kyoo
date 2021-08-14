using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;

namespace Kyoo.Controllers
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

			// TODO use http context to disable serialize as.
			// TODO check https://stackoverflow.com/questions/53288633/net-core-api-custom-json-resolver-based-on-request-values
			SerializeAsAttribute serializeAs = member?.GetCustomAttribute<SerializeAsAttribute>();
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

	public class PeopleRoleConverter : JsonConverter<PeopleRole>
	{
		public override void WriteJson(JsonWriter writer, PeopleRole value, JsonSerializer serializer)
		{
			ICollection<PeopleRole> oldPeople = value.Show?.People;
			ICollection<PeopleRole> oldRoles = value.People?.Roles;
			if (value.Show != null)
				value.Show.People = null;
			if (value.People != null)
				value.People.Roles = null;
			
			JObject obj = JObject.FromObject(value.ForPeople ? value.People : value.Show, serializer);
			obj.Add("role", value.Role);
			obj.Add("type", value.Type);
			obj.WriteTo(writer);

			if (value.Show != null)
				value.Show.People = oldPeople;
			if (value.People != null)
				value.People.Roles = oldRoles;
		}

		public override PeopleRole ReadJson(JsonReader reader, 
			Type objectType,
			PeopleRole existingValue,
			bool hasExistingValue,
			JsonSerializer serializer)
		{
			throw new NotImplementedException();
		}
	}

	public class SerializeAsProvider : IValueProvider
	{
		private string _format;
		private string _host;

		public SerializeAsProvider(string format, string host)
		{
			_format = format;
			_host = host.TrimEnd('/');
		}
		
		public object GetValue(object target)
		{
			return Regex.Replace(_format, @"(?<!{){(\w+)(:(\w+))?}", x =>
			{
				string value = x.Groups[1].Value;
				string modifier = x.Groups[3].Value;

				if (value == "HOST")
					return _host;
				
				PropertyInfo properties = target.GetType()
					.GetProperties(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)
					.FirstOrDefault(y => y.Name == value);
				if (properties == null)
					return null;
				object objValue = properties.GetValue(target);
				if (objValue is not string ret)
					ret = objValue?.ToString();
				if (ret == null)
					throw new ArgumentException($"Invalid serializer replacement {value}");

				foreach (char modification in modifier)
				{
					ret = modification switch
					{
						'l' => ret.ToLowerInvariant(),
						'u' => ret.ToUpperInvariant(),
						_ => throw new ArgumentException($"Invalid serializer modificator {modification}.")
					};
				}
				return ret;
			});
		}
		
		public void SetValue(object target, object value)
		{
			// Values are ignored and should not be editable, except if the internal value is set.
		}
	}
}