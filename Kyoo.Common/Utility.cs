using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using Kyoo.Models;

namespace Kyoo
{
	public interface IMergable<T>
	{
		public T Merge(T other);
	}
	
	public static class Utility
	{
		public static string ToSlug(string str)
		{
			if (str == null)
				return null;

			str = str.ToLowerInvariant();
			
			string normalizedString = str.Normalize(NormalizationForm.FormD);
			StringBuilder stringBuilder = new StringBuilder();
			foreach (char c in normalizedString)
			{
				UnicodeCategory unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
				if (unicodeCategory != UnicodeCategory.NonSpacingMark)
					stringBuilder.Append(c);
			}
			str = stringBuilder.ToString().Normalize(NormalizationForm.FormC);

			str = Regex.Replace(str, @"\s", "-", RegexOptions.Compiled);
			str = Regex.Replace(str, @"[^\w\s\p{Pd}]", "", RegexOptions.Compiled);
			str = str.Trim('-', '_');
			str = Regex.Replace(str, @"([-_]){2,}", "$1", RegexOptions.Compiled);
			return str;
		}
		
		
		public static void SetImage(Show show, string imgUrl, ImageType type)
		{
			switch(type)
			{
				case ImageType.Poster:
					show.Poster = imgUrl;
					break;
				case ImageType.Logo:
					show.Logo = imgUrl;
					break;
				case ImageType.Background:
					show.Backdrop = imgUrl;
					break;
				default:
					throw new ArgumentOutOfRangeException(nameof(type), type, null);
			}
		}

		public static IEnumerable<T> MergeLists<T>(IEnumerable<T> first, IEnumerable<T> second, Func<T, T, bool> isEqual = null)
		{
			if (first == null)
				return second;
			if (second == null)
				return first;
			List<T> list = first.ToList();
			if (isEqual == null)
				isEqual = (x, y) => x.Equals(y);
			return list.Concat(second.Where(x => !list.Any(y => isEqual(x, y)))).ToList();
		}

		public static T Complete<T>(T first, T second)
		{
			Type type = typeof(T);
			foreach (PropertyInfo property in type.GetProperties())
			{
				MethodInfo getter = property.GetGetMethod();
				MethodInfo setter = property.GetSetMethod();
				
				object value = getter != null ? getter.Invoke(second, null) : property.GetValue(second);
				object defaultValue = property.PropertyType.IsValueType ? Activator.CreateInstance(property.PropertyType) : null;
				
				if (value?.Equals(defaultValue) == false)
				{
					if (setter != null)
						setter.Invoke(first, new[] {value});
					else
						property.SetValue(second, value);
				}
			}

			return first;
		}
	}
}