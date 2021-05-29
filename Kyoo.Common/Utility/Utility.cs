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
			if (ex == null)
				return false;
			return ex.Body is MemberExpression ||
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