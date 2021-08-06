using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Reflection;
using JetBrains.Annotations;
using Kyoo.Models;
using Kyoo.Models.Attributes;

namespace Kyoo
{
	/// <summary>
	/// A class containing helper methods to merge objects.
	/// </summary>
	public static class Merger
	{
		/// <summary>
		/// Merge two lists, can keep duplicates or remove them.
		/// </summary>
		/// <param name="first">The first enumerable to merge</param>
		/// <param name="second">The second enumerable to merge, if items from this list are equals to one from the first, they are not kept</param>
		/// <param name="isEqual">Equality function to compare items. If this is null, duplicated elements are kept</param>
		/// <returns>The two list merged as an array</returns>
		[ContractAnnotation("first:notnull => notnull; second:notnull => notnull", true)]
		public static T[] MergeLists<T>([CanBeNull] IEnumerable<T> first,
			[CanBeNull] IEnumerable<T> second, 
			[CanBeNull] Func<T, T, bool> isEqual = null)
		{
			if (first == null)
				return second?.ToArray();
			if (second == null)
				return first.ToArray();
			if (isEqual == null)
				return first.Concat(second).ToArray();
			List<T> list = first.ToList();
			return list.Concat(second.Where(x => !list.Any(y => isEqual(x, y)))).ToArray();
		}

		/// <summary>
		/// Merge two dictionary, if the same key is found on both dictionary, the values of the first one is kept.
		/// </summary>
		/// <param name="first">The first dictionary to merge</param>
		/// <param name="second">The second dictionary to merge</param>
		/// <typeparam name="T">The type of the keys in dictionaries</typeparam>
		/// <typeparam name="T2">The type of values in the dictionaries</typeparam>
		/// <returns>The first dictionary with the missing elements of <paramref name="second"/>.</returns>
		/// <seealso cref="MergeDictionaries{T,T2}(System.Collections.Generic.IDictionary{T,T2},System.Collections.Generic.IDictionary{T,T2},out bool)"/>
		[ContractAnnotation("first:notnull => notnull; second:notnull => notnull", true)]
		public static IDictionary<T, T2> MergeDictionaries<T, T2>([CanBeNull] IDictionary<T, T2> first,
			[CanBeNull] IDictionary<T, T2> second)
		{
			return MergeDictionaries(first, second, out bool _);
		}

		/// <summary>
		/// Merge two dictionary, if the same key is found on both dictionary, the values of the first one is kept.
		/// </summary>
		/// <param name="first">The first dictionary to merge</param>
		/// <param name="second">The second dictionary to merge</param>
		/// <param name="hasChanged">
		/// <c>true</c> if a new items has been added to the dictionary, <c>false</c> otherwise.
		/// </param>
		/// <typeparam name="T">The type of the keys in dictionaries</typeparam>
		/// <typeparam name="T2">The type of values in the dictionaries</typeparam>
		/// <returns>The first dictionary with the missing elements of <paramref name="second"/>.</returns>
		[ContractAnnotation("first:notnull => notnull; second:notnull => notnull", true)]
		public static IDictionary<T, T2> MergeDictionaries<T, T2>([CanBeNull] IDictionary<T, T2> first,
			[CanBeNull] IDictionary<T, T2> second,
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
			foreach ((T key, T2 value) in second)
			{
				bool success = first.TryAdd(key, value);
				hasChanged |= success;
				
				if (success || first[key]?.Equals(default) == false || value?.Equals(default) != false)
					continue;
				first[key] = value;
				hasChanged = true;
			}

			return first;
		}

		/// <summary>
		/// Merge two dictionary, if the same key is found on both dictionary, the values of the second one is kept.
		/// </summary>
		/// <remarks>
		/// The only difference in this function compared to
		/// <see cref="MergeDictionaries{T,T2}(System.Collections.Generic.IDictionary{T,T2},System.Collections.Generic.IDictionary{T,T2}, out bool)"/>
		/// is the way <paramref name="hasChanged"/> is calculated and the order of the arguments.
		/// <code>
		/// MergeDictionaries(first, second);
		/// </code>
		/// will do the same thing as
		/// <code>
		/// CompleteDictionaries(second, first, out bool _);
		/// </code>
		/// </remarks>
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
		public static IDictionary<T, T2> CompleteDictionaries<T, T2>([CanBeNull] IDictionary<T, T2> first,
			[CanBeNull] IDictionary<T, T2> second,
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
		/// Set every fields of first to those of second. Ignore fields marked with the <see cref="NotMergeableAttribute"/> attribute
		/// At the end, the OnMerge method of first will be called if first is a <see cref="IOnMerge"/>
		/// </summary>
		/// <param name="first">The object to assign</param>
		/// <param name="second">The object containing new values</param>
		/// <typeparam name="T">Fields of T will be used</typeparam>
		/// <returns><see cref="first"/></returns>
		public static T Assign<T>(T first, T second)
		{
			Type type = typeof(T);
			IEnumerable<PropertyInfo> properties = type.GetProperties()
				.Where(x => x.CanRead && x.CanWrite 
				                      && Attribute.GetCustomAttribute(x, typeof(NotMergeableAttribute)) == null);
			
			foreach (PropertyInfo property in properties)
			{
				object value = property.GetValue(second);
				property.SetValue(first, value);
			}

			if (first is IOnMerge merge)
				merge.OnMerge(second);
			return first;
		}
		
		/// <summary>
		/// Set every non-default values of seconds to the corresponding property of second.
		/// Dictionaries are handled like anonymous objects with a property per key/pair value
		/// (see
		/// <see cref="MergeDictionaries{T,T2}(System.Collections.Generic.IDictionary{T,T2},System.Collections.Generic.IDictionary{T,T2})"/>
		/// for more details).
		/// At the end, the OnMerge method of first will be called if first is a <see cref="IOnMerge"/>
		/// </summary>
		/// <remarks>
		/// This does the opposite of <see cref="Merge{T}"/>.
		/// </remarks>
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
		/// <returns><see cref="first"/></returns>
		/// <exception cref="ArgumentNullException">If first is null</exception>
		public static T Complete<T>([NotNull] T first, 
			[CanBeNull] T second, 
			[InstantHandle] Func<PropertyInfo, bool> where = null)
		{
			if (first == null)
				throw new ArgumentNullException(nameof(first));
			if (second == null)
				return first;
			
			Type type = typeof(T);
			IEnumerable<PropertyInfo> properties = type.GetProperties()
				.Where(x => x.CanRead && x.CanWrite
				                      && Attribute.GetCustomAttribute(x, typeof(NotMergeableAttribute)) == null);

			if (where != null)
				properties = properties.Where(where);
			
			foreach (PropertyInfo property in properties)
			{
				object value = property.GetValue(second);
				object defaultValue = property.GetCustomAttribute<DefaultValueAttribute>()?.Value
					?? property.PropertyType.GetClrDefault();

				if (value?.Equals(defaultValue) != false || value.Equals(property.GetValue(first)))
					continue;
				if (Utility.IsOfGenericType(property.PropertyType, typeof(IDictionary<,>)))
				{
					Type[] dictionaryTypes = Utility.GetGenericDefinition(property.PropertyType, typeof(IDictionary<,>))
						.GenericTypeArguments;
					object[] parameters = {
						property.GetValue(first),
						value,
						false
					};
					object newDictionary = Utility.RunGenericMethod<object>(
						typeof(Merger),
						nameof(CompleteDictionaries),
						dictionaryTypes,
						parameters);
					if ((bool)parameters[2])
						property.SetValue(first, newDictionary);
				}
				else
					property.SetValue(first, value);
			}

			if (first is IOnMerge merge)
				merge.OnMerge(second);
			return first;
		}

		/// <summary>
		/// This will set missing values of <see cref="first"/> to the corresponding values of <see cref="second"/>.
		/// Enumerable will be merged (concatenated) and Dictionaries too.
		/// At the end, the OnMerge method of first will be called if first is a <see cref="IOnMerge"/>.
		/// </summary>
		/// <example>
		/// {id: 0, slug: "test"}, {id: 4, slug: "foo"} -> {id: 4, slug: "test"}
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
		/// <typeparam name="T">Fields of T will be merged</typeparam>
		/// <returns><see cref="first"/></returns>
		[ContractAnnotation("first:notnull => notnull; second:notnull => notnull", true)]
		public static T Merge<T>([CanBeNull] T first, 
			[CanBeNull] T second,
			[InstantHandle] Func<PropertyInfo, bool> where = null)
		{
			if (first == null)
				return second;
			if (second == null)
				return first;
			
			Type type = typeof(T);
			IEnumerable<PropertyInfo> properties = type.GetProperties()
				.Where(x => x.CanRead && x.CanWrite 
				                      && Attribute.GetCustomAttribute(x, typeof(NotMergeableAttribute)) == null);
			
			if (where != null)
				properties = properties.Where(where);
			
			foreach (PropertyInfo property in properties)
			{
				object oldValue = property.GetValue(first);
				object newValue = property.GetValue(second);
				object defaultValue = property.PropertyType.GetClrDefault();
				
				if (oldValue?.Equals(defaultValue) != false)
					property.SetValue(first, newValue);
				else if (Utility.IsOfGenericType(property.PropertyType, typeof(IDictionary<,>)))
				{
					Type[] dictionaryTypes = Utility.GetGenericDefinition(property.PropertyType, typeof(IDictionary<,>))
						.GenericTypeArguments;
					object[] parameters = {
						oldValue,
						newValue,
						false
					};
					object newDictionary = Utility.RunGenericMethod<object>(
						typeof(Merger),
						nameof(MergeDictionaries),
						dictionaryTypes,
						parameters);
					if ((bool)parameters[2])
						property.SetValue(first, newDictionary);
				}
				else if (typeof(IEnumerable).IsAssignableFrom(property.PropertyType)
				         && property.PropertyType != typeof(string))
				{
					Type enumerableType = Utility.GetGenericDefinition(property.PropertyType, typeof(IEnumerable<>))
						.GenericTypeArguments
						.First();
					Func<IResource, IResource, bool> equalityComparer = enumerableType.IsAssignableTo(typeof(IResource))
						? (x, y) =>  x.Slug == y.Slug
						: null;
					property.SetValue(first, Utility.RunGenericMethod<object>(
						typeof(Merger),
						nameof(MergeLists),
						enumerableType,
						oldValue, newValue, equalityComparer));
				}
			}

			if (first is IOnMerge merge)
				merge.OnMerge(second);
			return first;
		}

		/// <summary>
		/// Set every fields of <see cref="obj"/> to the default value.
		/// </summary>
		/// <param name="obj">The object to nullify</param>
		/// <typeparam name="T">Fields of T will be nullified</typeparam>
		/// <returns><see cref="obj"/></returns>
		public static T Nullify<T>(T obj)
		{
			Type type = typeof(T);
			foreach (PropertyInfo property in type.GetProperties())
			{
				if (!property.CanWrite || property.GetCustomAttribute<ComputedAttribute>() != null)
					continue;
				property.SetValue(obj, property.PropertyType.GetClrDefault());
			}

			return obj;
		}
	}
}