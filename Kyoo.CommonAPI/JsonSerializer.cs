using System;
using System.Buffers;
using System.Collections.Generic;
using System.Reflection;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Kyoo.Controllers
{
	public class JsonPropertySelector : CamelCasePropertyNamesContractResolver
	{
		private readonly Dictionary<Type, HashSet<string>> _ignored;
		private readonly Dictionary<Type, HashSet<string>> _forceSerialize;

		public JsonPropertySelector()
		{
			_ignored = new Dictionary<Type, HashSet<string>>();	
			_forceSerialize = new Dictionary<Type, HashSet<string>>();
		}
		
		public JsonPropertySelector(Dictionary<Type, HashSet<string>> ignored, Dictionary<Type, HashSet<string>> forceSerialize)
		{
			_ignored = ignored ?? new Dictionary<Type, HashSet<string>>();
			_forceSerialize = forceSerialize ?? new Dictionary<Type, HashSet<string>>();
		}

		private bool IsIgnored(Type type, string propertyName)
		{
			if (_ignored.ContainsKey(type) && _ignored[type].Contains(propertyName))
				return true;
			if (type.BaseType == null)
				return false;
			return _ignored.ContainsKey(type.BaseType) && _ignored[type.BaseType].Contains(propertyName);
		}

		private bool IsSerializationForced(Type type, string propertyName)
		{
			if (_forceSerialize.ContainsKey(type) && _forceSerialize[type].Contains(propertyName))
				return true;
			if (type.BaseType == null)
				return false;
			return _forceSerialize.ContainsKey(type.BaseType) && _forceSerialize[type.BaseType].Contains(propertyName);
		}

		protected override JsonProperty CreateProperty(MemberInfo member, MemberSerialization memberSerialization)
		{
			JsonProperty property = base.CreateProperty(member, memberSerialization);

			if (IsIgnored(property.DeclaringType, property.PropertyName))
			{
				property.ShouldSerialize = i => false;
				property.Ignored = true;
			}
			else if (IsSerializationForced(property.DeclaringType, property.PropertyName))
			{
				property.ShouldSerialize = i => true;
				property.Ignored = false;
			}
			return property;
		}
	}
	
	public class JsonDetailed : ActionFilterAttribute
	{
		public override void OnActionExecuted(ActionExecutedContext context)
		{
			if (context.Result is ObjectResult result)
			{
				result.Formatters.Add(new NewtonsoftJsonOutputFormatter(
					new JsonSerializerSettings
					{
						ContractResolver = new JsonPropertySelector(null, new Dictionary<Type, HashSet<string>>()
						{
							{typeof(Show), new HashSet<string> {"genres", "studio"}},
							{typeof(Episode), new HashSet<string> {"tracks"}},
							{typeof(PeopleLink), new HashSet<string> {"show"}}
						})
					},
				context.HttpContext.RequestServices.GetRequiredService<ArrayPool<char>>(), 
					context.HttpContext.RequestServices.GetRequiredService<IOptions<MvcOptions>>().Value));
			}
		}
	}
}