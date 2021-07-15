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
		public static T[] MergeLists<T>(IEnumerable<T> first,
			IEnumerable<T> second, 
			Func<T, T, bool> isEqual = null)
		{
			if (first == null)
				return second.ToArray();
			if (second == null)
				return first.ToArray();
			if (isEqual == null)
				return first.Concat(second).ToArray();
			List<T> list = first.ToList();
			return list.Concat(second.Where(x => !list.Any(y => isEqual(x, y)))).ToArray();
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
		/// Set every default values of first to the value of second. ex: {id: 0, slug: "test"}, {id: 4, slug: "foo"} -> {id: 4, slug: "test"}.
		/// At the end, the OnMerge method of first will be called if first is a <see cref="IOnMerge"/>
		/// </summary>
		/// <param name="first">The object to complete</param>
		/// <param name="second">Missing fields of first will be completed by fields of this item. If second is null, the function no-op.</param>
		/// <param name="where">Filter fields that will be merged</param>
		/// <typeparam name="T">Fields of T will be completed</typeparam>
		/// <returns><see cref="first"/></returns>
		/// <exception cref="ArgumentNullException">If first is null</exception>
		public static T Complete<T>([NotNull] T first, [CanBeNull] T second, Func<PropertyInfo, bool> where = null)
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

				if (value?.Equals(defaultValue) == false && value != property.GetValue(first))
					property.SetValue(first, value);
			}

			if (first is IOnMerge merge)
				merge.OnMerge(second);
			return first;
		}

		/// <summary>
		/// An advanced <see cref="Complete{T}"/> function.
		/// This will set missing values of <see cref="first"/> to the corresponding values of <see cref="second"/>.
		/// Enumerable will be merged (concatenated).
		/// At the end, the OnMerge method of first will be called if first is a <see cref="IOnMerge"/>.
		/// </summary>
		/// <param name="first">The object to complete</param>
		/// <param name="second">Missing fields of first will be completed by fields of this item. If second is null, the function no-op.</param>
		/// <typeparam name="T">Fields of T will be merged</typeparam>
		/// <returns><see cref="first"/></returns>
		[ContractAnnotation("first:notnull => notnull; second:notnull => notnull", true)]
		public static T Merge<T>([CanBeNull] T first, [CanBeNull] T second)
		{
			if (first == null)
				return second;
			if (second == null)
				return first;
			
			Type type = typeof(T);
			IEnumerable<PropertyInfo> properties = type.GetProperties()
				.Where(x => x.CanRead && x.CanWrite 
				                      && Attribute.GetCustomAttribute(x, typeof(NotMergeableAttribute)) == null);
			
			foreach (PropertyInfo property in properties)
			{
				object oldValue = property.GetValue(first);
				object newValue = property.GetValue(second);
				object defaultValue = property.PropertyType.GetClrDefault();
				
				if (oldValue?.Equals(defaultValue) != false)
					property.SetValue(first, newValue);
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