using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Runtime.ExceptionServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Models.Attributes;

namespace Kyoo
{
	/// <summary>
	/// A set of utility functions that can be used everywhere.
	/// </summary>
	public static class Utility
	{
		/// <summary>
		/// Is the lambda expression a member (like x => x.Body).
		/// </summary>
		/// <param name="ex">The expression that should be checked</param>
		/// <returns>True if the expression is a member, false otherwise</returns>
		public static bool IsPropertyExpression(LambdaExpression ex)
		{
			return ex == null ||
			       ex.Body is MemberExpression ||
			       ex.Body.NodeType == ExpressionType.Convert && ((UnaryExpression)ex.Body).Operand is MemberExpression;
		}
		
		/// <summary>
		/// Get the name of a property. Useful for selectors as members ex: Load(x => x.Shows)
		/// </summary>
		/// <param name="ex">The expression</param>
		/// <returns>The name of the expression</returns>
		/// <exception cref="ArgumentException">If the expression is not a property, ArgumentException is thrown.</exception>
		public static string GetPropertyName(LambdaExpression ex)
		{
			if (!IsPropertyExpression(ex))
				throw new ArgumentException($"{ex} is not a property expression.");
			MemberExpression member = ex.Body.NodeType == ExpressionType.Convert
				? ((UnaryExpression)ex.Body).Operand as MemberExpression
				: ex.Body as MemberExpression;
			return member!.Member.Name;
		}

		/// <summary>
		/// Get the value of a member (property or field)
		/// </summary>
		/// <param name="member">The member value</param>
		/// <param name="obj">The owner of this member</param>
		/// <returns>The value boxed as an object</returns>
		/// <exception cref="ArgumentNullException">if <see cref="member"/> or <see cref="obj"/> is null.</exception>
		/// <exception cref="ArgumentException">The member is not a field or a property.</exception>
		public static object GetValue([NotNull] this MemberInfo member, [NotNull] object obj)
		{
			if (member == null)
				throw new ArgumentNullException(nameof(member));
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			return member switch
			{
				PropertyInfo property => property.GetValue(obj),
				FieldInfo field => field.GetValue(obj),
				_ => throw new ArgumentException($"Can't get value of a non property/field (member: {member}).")
			};
		}
		
		/// <summary>
		/// Slugify a string (Replace spaces by -, Uniformize accents é -> e)
		/// </summary>
		/// <param name="str">The string to slugify</param>
		/// <returns>The slug version of the given string</returns>
		public static string ToSlug(string str)
		{
			if (str == null)
				return null;

			str = str.ToLowerInvariant();
			
			string normalizedString = str.Normalize(NormalizationForm.FormD);
			StringBuilder stringBuilder = new();
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
				object defaultValue = property.PropertyType.IsValueType
					? Activator.CreateInstance(property.PropertyType) 
					: null;

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
		public static T Merge<T>(T first, T second)
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
				object defaultValue = property.PropertyType.IsValueType
					? Activator.CreateInstance(property.PropertyType) 
					: null;
				
				if (oldValue?.Equals(defaultValue) != false)
					property.SetValue(first, newValue);
				else if (typeof(IEnumerable).IsAssignableFrom(property.PropertyType)
				         && property.PropertyType != typeof(string))
				{
					property.SetValue(first, RunGenericMethod<object>(
						typeof(Utility), 
						nameof(MergeLists),
						GetEnumerableType(property.PropertyType), 
						oldValue, newValue, null));
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
				if (!property.CanWrite)
					continue;
				
				object defaultValue = property.PropertyType.IsValueType 
					? Activator.CreateInstance(property.PropertyType) 
					: null;
				property.SetValue(obj, defaultValue);
			}

			return obj;
		}

		/// <summary>
		/// Return every <see cref="Type"/> in the inheritance tree of the parameter (interfaces are not returned)
		/// </summary>
		/// <param name="type">The starting type</param>
		/// <returns>A list of types</returns>
		/// <exception cref="ArgumentNullException"><see cref="type"/> can't be null</exception>
		public static IEnumerable<Type> GetInheritanceTree([NotNull] this Type type)
		{
			if (type == null)
				throw new ArgumentNullException(nameof(type));
			for (; type != null; type = type.BaseType)
				yield return type;
		}

		/// <summary>
		/// Check if <see cref="obj"/> inherit from a generic type <see cref="genericType"/>.
		/// </summary>
		/// <param name="obj">Does this object's type is a <see cref="genericType"/></param>
		/// <param name="genericType">The generic type to check against (Only generic types are supported like typeof(IEnumerable&lt;&gt;).</param>
		/// <returns>True if obj inherit from genericType. False otherwise</returns>
		/// <exception cref="ArgumentNullException">obj and genericType can't be null</exception>
		public static bool IsOfGenericType([NotNull] object obj, [NotNull] Type genericType)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			return IsOfGenericType(obj.GetType(), genericType);
		}
		
		/// <summary>
		/// Check if <see cref="type"/> inherit from a generic type <see cref="genericType"/>.
		/// </summary>
		/// <param name="type">The type to check</param>
		/// <param name="genericType">The generic type to check against (Only generic types are supported like typeof(IEnumerable&lt;&gt;).</param>
		/// <returns>True if obj inherit from genericType. False otherwise</returns>
		/// <exception cref="ArgumentNullException">obj and genericType can't be null</exception>
		public static bool IsOfGenericType([NotNull] Type type, [NotNull] Type genericType)
		{
			if (type == null)
				throw new ArgumentNullException(nameof(type));
			if (genericType == null)
				throw new ArgumentNullException(nameof(genericType));
			if (!genericType.IsGenericType)
				throw new ArgumentException($"{nameof(genericType)} is not a generic type.");

			IEnumerable<Type> types = genericType.IsInterface
				? type.GetInterfaces()
				: type.GetInheritanceTree();
			return types.Any(x => x.IsGenericType && x.GetGenericTypeDefinition() == genericType);
		}

		/// <summary>
		/// Get the generic definition of <see cref="genericType"/>.
		/// For example, calling this function with List&lt;string&gt; and typeof(IEnumerable&lt;&gt;) will return IEnumerable&lt;string&gt;
		/// </summary>
		/// <param name="type">The type to check</param>
		/// <param name="genericType">The generic type to check against (Only generic types are supported like typeof(IEnumerable&lt;&gt;).</param>
		/// <returns>The generic definition of genericType that type inherit or null if type does not implement the generic type.</returns>
		/// <exception cref="ArgumentNullException"><see cref="type"/> and <see cref="genericType"/> can't be null</exception>
		/// <exception cref="ArgumentException"><see cref="genericType"/> must be a generic type</exception>
		public static Type GetGenericDefinition([NotNull] Type type, [NotNull] Type genericType)
		{
			if (type == null)
				throw new ArgumentNullException(nameof(type));
			if (genericType == null)
				throw new ArgumentNullException(nameof(genericType));
			if (!genericType.IsGenericType)
				throw new ArgumentException($"{nameof(genericType)} is not a generic type.");

			IEnumerable<Type> types = genericType.IsInterface
				? type.GetInterfaces()
				: type.GetInheritanceTree();
			return types.FirstOrDefault(x => x.IsGenericType && x.GetGenericTypeDefinition() == genericType);
		}

		/// <summary>
		/// A Select where the index of the item can be used.
		/// </summary>
		/// <param name="self">The IEnumerable to map. If self is null, an empty list is returned</param>
		/// <param name="mapper">The function that will map each items</param>
		/// <typeparam name="T">The type of items in <see cref="self"/></typeparam>
		/// <typeparam name="T2">The type of items in the returned list</typeparam>
		/// <returns>The list mapped.</returns>
		/// <exception cref="ArgumentNullException">mapper can't be null</exception>
		public static IEnumerable<T2> Map<T, T2>([CanBeNull] this IEnumerable<T> self, 
			[NotNull] Func<T, int, T2> mapper)
		{
			if (self == null)
				yield break;
			if (mapper == null)
				throw new ArgumentNullException(nameof(mapper));
			
			using IEnumerator<T> enumerator = self.GetEnumerator();
			int index = 0;

			while (enumerator.MoveNext())
			{
				yield return mapper(enumerator.Current, index);
				index++;
			}
		}
		
		/// <summary>
		/// A map where the mapping function is asynchronous.
		/// Note: <see cref="SelectAsync{T,T2}"/> might interest you. 
		/// </summary>
		/// <param name="self">The IEnumerable to map. If self is null, an empty list is returned</param>
		/// <param name="mapper">The asynchronous function that will map each items</param>
		/// <typeparam name="T">The type of items in <see cref="self"/></typeparam>
		/// <typeparam name="T2">The type of items in the returned list</typeparam>
		/// <returns>The list mapped as an AsyncEnumerable</returns>
		/// <exception cref="ArgumentNullException">mapper can't be null</exception>
		public static async IAsyncEnumerable<T2> MapAsync<T, T2>([CanBeNull] this IEnumerable<T> self, 
			[NotNull] Func<T, int, Task<T2>> mapper)
		{
			if (self == null)
				yield break;
			if (mapper == null)
				throw new ArgumentNullException(nameof(mapper));
			
			using IEnumerator<T> enumerator = self.GetEnumerator();
			int index = 0;

			while (enumerator.MoveNext())
			{
				yield return await mapper(enumerator.Current, index);
				index++;
			}
		}
		
		/// <summary>
		/// An asynchronous version of Select.
		/// </summary>
		/// <param name="self">The IEnumerable to map</param>
		/// <param name="mapper">The asynchronous function that will map each items</param>
		/// <typeparam name="T">The type of items in <see cref="self"/></typeparam>
		/// <typeparam name="T2">The type of items in the returned list</typeparam>
		/// <returns>The list mapped as an AsyncEnumerable</returns>
		/// <exception cref="ArgumentNullException">mapper can't be null</exception>
		public static async IAsyncEnumerable<T2> SelectAsync<T, T2>([CanBeNull] this IEnumerable<T> self, 
			[NotNull] Func<T, Task<T2>> mapper)
		{
			if (self == null)
				yield break;
			if (mapper == null)
				throw new ArgumentNullException(nameof(mapper));
			
			using IEnumerator<T> enumerator = self.GetEnumerator();

			while (enumerator.MoveNext())
				yield return await mapper(enumerator.Current);
		}

		/// <summary>
		/// Convert an AsyncEnumerable to a List by waiting for every item.
		/// </summary>
		/// <param name="self">The async list</param>
		/// <typeparam name="T">The type of items in the async list and in the returned list.</typeparam>
		/// <returns>A task that will return a simple list</returns>
		/// <exception cref="ArgumentNullException">The list can't be null</exception>
		public static async Task<List<T>> ToListAsync<T>([NotNull] this IAsyncEnumerable<T> self)
		{
			if (self == null)
				throw new ArgumentNullException(nameof(self));
			
			List<T> ret = new();
			
			await foreach(T i in self)
				ret.Add(i);
			return ret;
		}

		/// <summary>
		/// If the enumerable is empty, execute an action.
		/// </summary>
		/// <param name="self">The enumerable to check</param>
		/// <param name="action">The action to execute is the list is empty</param>
		/// <typeparam name="T">The type of items inside the list</typeparam>
		/// <returns></returns>
		public static IEnumerable<T> IfEmpty<T>(this IEnumerable<T> self, Action action)
		{
			using IEnumerator<T> enumerator = self.GetEnumerator();

			if (!enumerator.MoveNext())
			{
				action();
				yield break;
			}
			
			do
			{
				yield return enumerator.Current;
			}
			while (enumerator.MoveNext());
		}

		/// <summary>
		/// A foreach used as a function with a little specificity: the list can be null.
		/// </summary>
		/// <param name="self">The list to enumerate. If this is null, the function result in a no-op</param>
		/// <param name="action">The action to execute for each arguments</param>
		/// <typeparam name="T">The type of items in the list</typeparam>
		public static void ForEach<T>([CanBeNull] this IEnumerable<T> self, Action<T> action)
		{
			if (self == null)
				return;
			foreach (T i in self)
				action(i);
		}
		
		/// <summary>
		/// A foreach used as a function with a little specificity: the list can be null.
		/// </summary>
		/// <param name="self">The list to enumerate. If this is null, the function result in a no-op</param>
		/// <param name="action">The action to execute for each arguments</param>
		public static void ForEach([CanBeNull] this IEnumerable self, Action<object> action)
		{
			if (self == null)
				return;
			foreach (object i in self)
				action(i);
		}
		
		public static async Task ForEachAsync<T>([CanBeNull] this IEnumerable<T> self, Func<T, Task> action)
		{
			if (self == null)
				return;
			foreach (T i in self)
				await action(i);
		}
		
		public static async Task ForEachAsync<T>([CanBeNull] this IAsyncEnumerable<T> self, Action<T> action)
		{
			if (self == null)
				return;
			await foreach (T i in self)
				action(i);
		}
		
		public static async Task ForEachAsync([CanBeNull] this IEnumerable self, Func<object, Task> action)
		{
			if (self == null)
				return;
			foreach (object i in self)
				await action(i);
		}

		public static MethodInfo GetMethod(Type type, BindingFlags flag, string name, Type[] generics, object[] args)
		{
			MethodInfo[] methods = type.GetMethods(flag | BindingFlags.Public)
				.Where(x => x.Name == name)
				.Where(x => x.GetGenericArguments().Length == generics.Length)
				.Where(x => x.GetParameters().Length == args.Length)
				.IfEmpty(() => throw new NullReferenceException($"A method named {name} with " +
				                                                $"{args.Length} arguments and {generics.Length} generic " +
				                                                $"types could not be found on {type.Name}."))
				// TODO this won't work but I don't know why.
				// .Where(x =>
				// {
				// 	int i = 0;
				// 	return x.GetGenericArguments().All(y => y.IsAssignableFrom(generics[i++]));
				// })
				// .IfEmpty(() => throw new NullReferenceException($"No method {name} match the generics specified."))
				
				// TODO this won't work for Type<T> because T is specified in arguments but not in the parameters type.
				// .Where(x =>
				// {
				// 	int i = 0;
				// 	return x.GetParameters().All(y => y.ParameterType.IsInstanceOfType(args[i++]));
				// })
				// .IfEmpty(() => throw new NullReferenceException($"No method {name} match the parameters's types."))
				.Take(2)
				.ToArray();

			if (methods.Length == 1)
				return methods[0];
			throw new NullReferenceException($"Multiple methods named {name} match the generics and parameters constraints.");
		}
		
		public static T RunGenericMethod<T>(
			[NotNull] Type owner, 
			[NotNull] string methodName,
			[NotNull] Type type,
			params object[] args)
		{
			return RunGenericMethod<T>(owner, methodName, new[] {type}, args);
		}
		
		public static T RunGenericMethod<T>(
			[NotNull] Type owner, 
			[NotNull] string methodName,
			[NotNull] Type[] types,
			params object[] args)
		{
			if (owner == null)
				throw new ArgumentNullException(nameof(owner));
			if (methodName == null)
				throw new ArgumentNullException(nameof(methodName));
			if (types == null)
				throw new ArgumentNullException(nameof(types));
			if (types.Length < 1)
				throw new ArgumentException($"The {nameof(types)} array is empty. At least one type is needed.");
			MethodInfo method = GetMethod(owner, BindingFlags.Static, methodName, types, args);
			return (T)method.MakeGenericMethod(types).Invoke(null, args?.ToArray());
		}

		public static T RunGenericMethod<T>(
			[NotNull] object instance,
			[NotNull] string methodName,
			[NotNull] Type type,
			params object[] args)
		{
			return RunGenericMethod<T>(instance, methodName, new[] {type}, args);
		}

		public static T RunGenericMethod<T>(
			[NotNull] object instance, 
			[NotNull] string methodName,
			[NotNull] Type[] types,
			params object[] args)
		{
			if (instance == null)
				throw new ArgumentNullException(nameof(instance));
			if (methodName == null)
				throw new ArgumentNullException(nameof(methodName));
			if (types == null || types.Length == 0)
				throw new ArgumentNullException(nameof(types));
			MethodInfo method = GetMethod(instance.GetType(), BindingFlags.Instance, methodName, types, args);
			return (T)method.MakeGenericMethod(types).Invoke(instance, args?.ToArray());
		}

		[NotNull]
		public static Type GetEnumerableType([NoEnumeration] [NotNull] IEnumerable list)
		{
			if (list == null)
				throw new ArgumentNullException(nameof(list));
			Type type = list.GetType().GetInterfaces().FirstOrDefault(t => typeof(IEnumerable).IsAssignableFrom(t) 
			                                                         && t.GetGenericArguments().Any()) ?? list.GetType();
			return type.GetGenericArguments().First();
		}
		
		public static Type GetEnumerableType([NotNull] Type listType)
		{
			if (listType == null)
				throw new ArgumentNullException(nameof(listType));
			if (!typeof(IEnumerable).IsAssignableFrom(listType))
				throw new InvalidOperationException($"The {nameof(listType)} parameter was not an IEnumerable.");
			Type type = listType.GetInterfaces().FirstOrDefault(t => typeof(IEnumerable).IsAssignableFrom(t) 
			                                                && t.GetGenericArguments().Any()) ?? listType;
			return type.GetGenericArguments().First();
		}

		public static IEnumerable<List<T>> BatchBy<T>(this List<T> list, int countPerList)
		{
			for (int i = 0; i < list.Count; i += countPerList)
				yield return list.GetRange(i, Math.Min(list.Count - i, countPerList));
		}
		
		public static IEnumerable<T[]> BatchBy<T>(this IEnumerable<T> list, int countPerList)
		{
			T[] ret = new T[countPerList];
			int i = 0;
			
			using IEnumerator<T> enumerator = list.GetEnumerator();
			while (enumerator.MoveNext())
			{
				ret[i] = enumerator.Current;
				i++;
				if (i < countPerList)
					continue;
				i = 0;
				yield return ret;
			}

			Array.Resize(ref ret, i);
			yield return ret;
		}
		
		public static string ToQueryString(this Dictionary<string, string> query)
		{
			if (!query.Any())
				return string.Empty;
			return "?" + string.Join('&', query.Select(x => $"{x.Key}={x.Value}"));
		}

		[System.Diagnostics.CodeAnalysis.DoesNotReturn]
		public static void ReThrow([NotNull] this Exception ex)
		{
			if (ex == null)
				throw new ArgumentNullException(nameof(ex));
			ExceptionDispatchInfo.Capture(ex).Throw();
		}
		
		public static Task<T> Then<T>(this Task<T> task, Action<T> map)
		{
			return task.ContinueWith(x =>
			{
				if (x.IsFaulted)
					x.Exception!.InnerException!.ReThrow();
				if (x.IsCanceled)
					throw new TaskCanceledException();
				map(x.Result);
				return x.Result;
			}, TaskContinuationOptions.ExecuteSynchronously);
		}

		public static Task<TResult> Map<T, TResult>(this Task<T> task, Func<T, TResult> map)
		{
			return task.ContinueWith(x =>
			{
				if (x.IsFaulted)
					x.Exception!.InnerException!.ReThrow();
				if (x.IsCanceled)
					throw new TaskCanceledException();
				return map(x.Result);
			}, TaskContinuationOptions.ExecuteSynchronously);
		}

		public static Task<T> Cast<T>(this Task task)
		{
			return task.ContinueWith(x =>
			{
				if (x.IsFaulted)
					x.Exception!.InnerException!.ReThrow();
				if (x.IsCanceled)
					throw new TaskCanceledException();
				return (T)((dynamic)x).Result;
			}, TaskContinuationOptions.ExecuteSynchronously);
		}

		/// <summary>
		/// Get a friendly type name (supporting generics)
		/// For example a list of string will be displayed as List&lt;string&gt; and not as List`1.
		/// </summary>
		/// <param name="type">The type to use</param>
		/// <returns>The friendly name of the type</returns>
		public static string FriendlyName(this Type type)
		{
			if (!type.IsGenericType)
				return type.Name;
			string generics = string.Join(", ", type.GetGenericArguments().Select(x => x.FriendlyName()));
			return $"{type.Name[..type.Name.IndexOf('`')]}<{generics}>";
		}
	}
}