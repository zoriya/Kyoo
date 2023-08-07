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
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using JetBrains.Annotations;
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Utils
{
	/// <summary>
	/// A class containing helper methods to merge objects.
	/// </summary>
	public static class Merger
	{
		/// <summary>
		/// Merge two dictionary, if the same key is found on both dictionary, the values of the second one is kept.
		/// </summary>
		/// <param name="first">The first dictionary to merge</param>
		/// <param name="second">The second dictionary to merge</param>
		/// <param name="hasChanged">
		/// <c>true</c> if a new items has been added to the dictionary, <c>false</c> otherwise.
		/// </param>
		/// <typeparam name="T">The type of the keys in dictionaries</typeparam>
		/// <typeparam name="T2">The type of values in the dictionaries</typeparam>
		/// <returns>
		/// A dictionary with the missing elements of <paramref name="second"/>
		/// set to those of <paramref name="first"/>.
		/// </returns>
		[ContractAnnotation("first:notnull => notnull; second:notnull => notnull", true)]
		public static IDictionary<T, T2>? CompleteDictionaries<T, T2>(IDictionary<T, T2>? first,
			IDictionary<T, T2>? second,
			out bool hasChanged)
		{
			if (first == null)
			{
				hasChanged = true;
				return second;
			}

			hasChanged = false;
			if (second == null)
				return first;
			hasChanged = second.Any(x => x.Value?.Equals(first[x.Key]) == false);
			foreach ((T key, T2 value) in first)
				second.TryAdd(key, value);
			return second;
		}

		/// <summary>
		/// Set every non-default values of seconds to the corresponding property of second.
		/// Dictionaries are handled like anonymous objects with a property per key/pair value
		/// At the end, the OnMerge method of first will be called if first is a <see cref="IOnMerge"/>
		/// </summary>
		/// <example>
		/// {id: 0, slug: "test"}, {id: 4, slug: "foo"} -> {id: 4, slug: "foo"}
		/// </example>
		/// <param name="first">
		/// The object to complete
		/// </param>
		/// <param name="second">
		/// Missing fields of first will be completed by fields of this item. If second is null, the function no-op.
		/// </param>
		/// <param name="where">
		/// Filter fields that will be merged
		/// </param>
		/// <typeparam name="T">Fields of T will be completed</typeparam>
		/// <returns><paramref name="first"/></returns>
		public static T Complete<T>(T first,
			T? second,
			[InstantHandle] Func<PropertyInfo, bool>? where = null)
		{
			if (second == null)
				return first;

			Type type = typeof(T);
			IEnumerable<PropertyInfo> properties = type.GetProperties()
				.Where(x => x is { CanRead: true, CanWrite: true }
					&& Attribute.GetCustomAttribute(x, typeof(NotMergeableAttribute)) == null);

			if (where != null)
				properties = properties.Where(where);

			foreach (PropertyInfo property in properties)
			{
				object? value = property.GetValue(second);

				if (value?.Equals(property.GetValue(first)) == true)
					continue;

				if (Utility.IsOfGenericType(property.PropertyType, typeof(IDictionary<,>)))
				{
					Type[] dictionaryTypes = Utility.GetGenericDefinition(property.PropertyType, typeof(IDictionary<,>))!
						.GenericTypeArguments;
					object?[] parameters =
					{
						property.GetValue(first),
						value,
						false
					};
					object newDictionary = Utility.RunGenericMethod<object>(
						typeof(Merger),
						nameof(CompleteDictionaries),
						dictionaryTypes,
						parameters)!;
					if ((bool)parameters[2]!)
						property.SetValue(first, newDictionary);
				}
				else
					property.SetValue(first, value);
			}

			if (first is IOnMerge merge)
				merge.OnMerge(second);
			return first;
		}
	}
}
