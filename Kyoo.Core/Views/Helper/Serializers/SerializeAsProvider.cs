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
