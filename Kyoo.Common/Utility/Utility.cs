using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Runtime.ExceptionServices;
using System.Text;
using System.Text.RegularExpressions;
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
		/// Get the default value of a type.
		/// </summary>
		/// <param name="type">The type to get the default value</param>
		/// <returns>The default value of the given type.</returns>
		public static object GetClrDefault(this Type type)
		{
			return type.IsValueType
				? Activator.CreateInstance(type) 
				: null;
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
		/// Retrieve a method from an <see cref="Type"/> with the given name and respect the
		/// amount of parameters and generic parameters. This works for polymorphic methods.
		/// </summary>
		/// <param name="type">
		/// The type owning the method. For non static methods, this is the <c>this</c>.
		/// </param>
		/// <param name="flag">
		/// The binding flags of the method. This allow you to specify public/private and so on.
		/// </param>
		/// <param name="name">
		/// The name of the method.
		/// </param>
		/// <param name="generics">
		/// The list of generic parameters.
		/// </param>
		/// <param name="args">
		/// The list of parameters. 
		/// </param>
		/// <exception cref="ArgumentException">No method match the given constraints.</exception>
		/// <returns>The method handle of the matching method.</returns>
		[PublicAPI]
		[NotNull]
		public static MethodInfo GetMethod([NotNull] Type type, 
			BindingFlags flag,
			string name, 
			[NotNull] Type[] generics,
			[NotNull] object[] args)
		{
			if (type == null)
				throw new ArgumentNullException(nameof(type));
			if (generics == null)
				throw new ArgumentNullException(nameof(generics));
			if (args == null)
				throw new ArgumentNullException(nameof(args));
			
			MethodInfo[] methods = type.GetMethods(flag | BindingFlags.Public)
				.Where(x => x.Name == name)
				.Where(x => x.GetGenericArguments().Length == generics.Length)
				.Where(x => x.GetParameters().Length == args.Length)
				.IfEmpty(() => throw new ArgumentException($"A method named {name} with " +
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
			throw new ArgumentException($"Multiple methods named {name} match the generics and parameters constraints.");
		}
		
		/// <summary>
		/// Run a generic static method for a runtime <see cref="Type"/>.
		/// </summary>
		/// <example>
		/// To run <see cref="Merger.MergeLists{T}"/> for a List where you don't know the type at compile type,
		/// you could do:
		/// <code>
		/// Utility.RunGenericMethod&lt;object&gt;(
		///     typeof(Utility),
		///     nameof(MergeLists),
		///     enumerableType,
		///     oldValue, newValue, equalityComparer)
		/// </code>
		/// </example>
		/// <param name="owner">The type that owns the method. For non static methods, the type of <c>this</c>.</param>
		/// <param name="methodName">The name of the method. You should use the <c>nameof</c> keyword.</param>
		/// <param name="type">The generic type to run the method with.</param>
		/// <param name="args">The list of arguments of the method</param>
		/// <typeparam name="T">
		/// The return type of the method. You can put <see cref="object"/> for an unknown one.
		/// </typeparam>
		/// <exception cref="ArgumentException">No method match the given constraints.</exception>
		/// <returns>The return of the method you wanted to run.</returns>
		/// <seealso cref="RunGenericMethod{T}(object,string,System.Type,object[])"/>
		/// <seealso cref="RunGenericMethod{T}(System.Type,string,System.Type[],object[])"/>
		public static T RunGenericMethod<T>(
			[NotNull] Type owner, 
			[NotNull] string methodName,
			[NotNull] Type type,
			params object[] args)
		{
			return RunGenericMethod<T>(owner, methodName, new[] {type}, args);
		}
		
		/// <summary>
		/// Run a generic static method for a multiple runtime <see cref="Type"/>.
		/// If your generic method only needs one type, see
		/// <see cref="RunGenericMethod{T}(System.Type,string,System.Type,object[])"/>
		/// </summary>
		/// <example>
		/// To run <see cref="Merger.MergeLists{T}"/> for a List where you don't know the type at compile type,
		/// you could do:
		/// <code>
		/// Utility.RunGenericMethod&lt;object&gt;(
		///     typeof(Utility),
		///     nameof(MergeLists),
		///     enumerableType,
		///     oldValue, newValue, equalityComparer)
		/// </code>
		/// </example>
		/// <param name="owner">The type that owns the method. For non static methods, the type of <c>this</c>.</param>
		/// <param name="methodName">The name of the method. You should use the <c>nameof</c> keyword.</param>
		/// <param name="types">The list of generic types to run the method with.</param>
		/// <param name="args">The list of arguments of the method</param>
		/// <typeparam name="T">
		/// The return type of the method. You can put <see cref="object"/> for an unknown one.
		/// </typeparam>
		/// <exception cref="ArgumentException">No method match the given constraints.</exception>
		/// <returns>The return of the method you wanted to run.</returns>
		/// <seealso cref="RunGenericMethod{T}(object,string,System.Type[],object[])"/>
		/// <seealso cref="RunGenericMethod{T}(System.Type,string,System.Type,object[])"/>
		[PublicAPI]
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
			return (T)method.MakeGenericMethod(types).Invoke(null, args.ToArray());
		}

		/// <summary>
		/// Run a generic method for a runtime <see cref="Type"/>.
		/// </summary>
		/// <example>
		/// To run <see cref="Merger.MergeLists{T}"/> for a List where you don't know the type at compile type,
		/// you could do:
		/// <code>
		/// Utility.RunGenericMethod&lt;object&gt;(
		///     typeof(Utility),
		///     nameof(MergeLists),
		///     enumerableType,
		///     oldValue, newValue, equalityComparer)
		/// </code>
		/// </example>
		/// <param name="instance">The <c>this</c> of the method to run.</param>
		/// <param name="methodName">The name of the method. You should use the <c>nameof</c> keyword.</param>
		/// <param name="type">The generic type to run the method with.</param>
		/// <param name="args">The list of arguments of the method</param>
		/// <typeparam name="T">
		/// The return type of the method. You can put <see cref="object"/> for an unknown one.
		/// </typeparam>
		/// <exception cref="ArgumentException">No method match the given constraints.</exception>
		/// <returns>The return of the method you wanted to run.</returns>
		/// <seealso cref="RunGenericMethod{T}(object,string,System.Type,object[])"/>
		/// <seealso cref="RunGenericMethod{T}(System.Type,string,System.Type[],object[])"/>
		public static T RunGenericMethod<T>(
			[NotNull] object instance,
			[NotNull] string methodName,
			[NotNull] Type type,
			params object[] args)
		{
			return RunGenericMethod<T>(instance, methodName, new[] {type}, args);
		}

		/// <summary>
		/// Run a generic method for a multiple runtime <see cref="Type"/>.
		/// If your generic method only needs one type, see
		/// <see cref="RunGenericMethod{T}(object,string,System.Type,object[])"/>
		/// </summary>
		/// <example>
		/// To run <see cref="Merger.MergeLists{T}"/> for a List where you don't know the type at compile type,
		/// you could do:
		/// <code>
		/// Utility.RunGenericMethod&lt;object&gt;(
		///     typeof(Utility),
		///     nameof(MergeLists),
		///     enumerableType,
		///     oldValue, newValue, equalityComparer)
		/// </code>
		/// </example>
		/// <param name="instance">The <c>this</c> of the method to run.</param>
		/// <param name="methodName">The name of the method. You should use the <c>nameof</c> keyword.</param>
		/// <param name="types">The list of generic types to run the method with.</param>
		/// <param name="args">The list of arguments of the method</param>
		/// <typeparam name="T">
		/// The return type of the method. You can put <see cref="object"/> for an unknown one.
		/// </typeparam>
		/// <exception cref="ArgumentException">No method match the given constraints.</exception>
		/// <returns>The return of the method you wanted to run.</returns>
		/// <seealso cref="RunGenericMethod{T}(object,string,System.Type[],object[])"/>
		/// <seealso cref="RunGenericMethod{T}(System.Type,string,System.Type,object[])"/>
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
			return (T)method.MakeGenericMethod(types).Invoke(instance, args.ToArray());
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