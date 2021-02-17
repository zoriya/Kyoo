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
using Kyoo.Models;
using Kyoo.Models.Attributes;

namespace Kyoo
{
	public static class Utility
	{
		public static bool IsPropertyExpression<T, T2>(Expression<Func<T, T2>> ex)
		{
			return ex == null ||
			       ex.Body is MemberExpression ||
			       ex.Body.NodeType == ExpressionType.Convert && ((UnaryExpression)ex.Body).Operand is MemberExpression;
		}
		
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

		public static IEnumerable<T> MergeLists<T>(IEnumerable<T> first,
			IEnumerable<T> second, 
			Func<T, T, bool> isEqual = null)
		{
			if (first == null)
				return second;
			if (second == null)
				return first;
			if (isEqual == null)
				return first.Concat(second).ToList();
			List<T> list = first.ToList();
			return list.Concat(second.Where(x => !list.Any(y => isEqual(x, y))));
		}

		public static T Assign<T>(T first, T second)
		{
			Type type = typeof(T);
			IEnumerable<PropertyInfo> properties = type.GetProperties()
				.Where(x => x.CanRead 
				            && x.CanWrite 
				            && Attribute.GetCustomAttribute(x, typeof(NotMergableAttribute)) == null);
			
			foreach (PropertyInfo property in properties)
			{
				object value = property.GetValue(second);
				property.SetValue(first, value);
			}

			if (first is IOnMerge merge)
				merge.OnMerge(second);
			return first;
		}
		
		public static T Complete<T>(T first, T second)
		{
			if (first == null)
				throw new ArgumentNullException(nameof(first));
			if (second == null)
				return first;
			
			Type type = typeof(T);
			IEnumerable<PropertyInfo> properties = type.GetProperties()
				.Where(x => x.CanRead && x.CanWrite 
				                      && Attribute.GetCustomAttribute(x, typeof(NotMergableAttribute)) == null);
			
			foreach (PropertyInfo property in properties)
			{
				object value = property.GetValue(second);
				object defaultValue = property.PropertyType.IsValueType
					? Activator.CreateInstance(property.PropertyType) 
					: null;

				if (value?.Equals(defaultValue) == false)
					property.SetValue(first, value);
			}

			if (first is IOnMerge merge)
				merge.OnMerge(second);
			return first;
		}

		public static T Merge<T>(T first, T second)
		{
			if (first == null)
				return second;
			if (second == null)
				return first;
			
			Type type = typeof(T);
			IEnumerable<PropertyInfo> properties = type.GetProperties()
				.Where(x => x.CanRead
				            && x.CanWrite 
				            && Attribute.GetCustomAttribute(x, typeof(NotMergableAttribute)) == null);
			
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
						"MergeLists",
						GetEnumerableType(property.PropertyType), 
						oldValue, newValue, null));
				}
			}

			if (first is IOnMerge merge)
				merge.OnMerge(second);
			return first;
		}

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

		public static IEnumerable<Type> GetInheritanceTree([NotNull] this Type type)
		{
			if (type == null)
				throw new ArgumentNullException(nameof(type));
			for (; type != null; type = type.BaseType)
				yield return type;
		}

		public static bool IsOfGenericType([NotNull] object obj, [NotNull] Type genericType)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			return IsOfGenericType(obj.GetType(), genericType);
		}
		
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

		public static IEnumerable<T> IfEmpty<T>(this IEnumerable<T> self, Action action)
		{
			using IEnumerator<T> enumerator = self.GetEnumerator();

			if (!enumerator.MoveNext())
			{
				action();
				yield break;
			}

			yield return enumerator.Current;
			while (enumerator.MoveNext())
				yield return enumerator.Current;
		}

		private static MethodInfo GetMethod(Type type, BindingFlags flag, string name, Type[] generics, object[] args)
		{
			MethodInfo[] methods = type.GetMethods(flag | BindingFlags.Public | BindingFlags.NonPublic)
				.Where(x => x.Name == name)
				.Where(x => x.GetGenericArguments().Length == generics.Length)
				.Where(x => x.GetParameters().Length == args.Length)
				.IfEmpty(() => throw new NullReferenceException($"A method named {name} with " +
				                                                $"{args.Length} arguments and {generics.Length} generic " +
				                                                $"types could not be found on {type.Name}."))
				.Where(x =>
				{
					int i = 0;
					return x.GetGenericArguments().All(y => y.IsAssignableFrom(generics[i++]));
				})
				.IfEmpty(() => throw new NullReferenceException($"No method {name} match the generics specified."))
				.Where(x =>
				{
					int i = 0;
					return x.GetParameters().All(y => y.ParameterType == args[i++].GetType());
				})
				.IfEmpty(() => throw new NullReferenceException($"No method {name} match the parameters's types."))
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
		
		public static bool ResourceEquals([CanBeNull] object first, [CanBeNull] object second)
		{
			if (ReferenceEquals(first, second))
				return true;
			if (first is IResource f && second is IResource s)
				return ResourceEquals(f, s);
			IEnumerable eno = first as IEnumerable;
			IEnumerable ens = second as IEnumerable;
			if (eno == null || ens == null)
				throw new ArgumentException("Arguments are not resources or lists of resources.");
			Type type = GetEnumerableType(eno);
			if (typeof(IResource).IsAssignableFrom(type))
				return ResourceEquals(eno.Cast<IResource>(), ens.Cast<IResource>());
			Type genericDefinition = GetGenericDefinition(type, typeof(IResourceLink<,>));
			if (genericDefinition == null)
				return RunGenericMethod<bool>(typeof(Enumerable), "SequenceEqual", type, first, second);
			Type[] types = genericDefinition.GetGenericArguments().Prepend(type).ToArray();
			return RunGenericMethod<bool>(typeof(Utility), "LinkEquals", types, eno, ens);
		}
		
		public static bool ResourceEquals<T>([CanBeNull] T first, [CanBeNull] T second)
			where T : IResource
		{
			if (ReferenceEquals(first, second))
				return true;
			if (first == null || second == null)
				return false;
			return first.ID == second.ID || first.Slug == second.Slug;
		}
		
		public static bool ResourceEquals<T>([CanBeNull] IEnumerable<T> first, [CanBeNull] IEnumerable<T> second) 
			where T : IResource
		{
			if (ReferenceEquals(first, second))
				return true;
			if (first == null || second == null)
				return false;
			return first.SequenceEqual(second, new ResourceComparer<T>());
		}

		public static bool LinkEquals<T>([CanBeNull] T first, int? firstID, [CanBeNull] T second, int? secondID)
			where T : IResource
		{
			if (ResourceEquals(first, second))
				return true;
			if (first == null && second != null
				&& firstID == second.ID)
				return true;
			if (first != null && second == null 
				&& first.ID == secondID)
				return true;
			return firstID == secondID;
		}
		
		public static bool LinkEquals<T, T1, T2>([CanBeNull] IEnumerable<T> first, [CanBeNull] IEnumerable<T> second) 
			where T : IResourceLink<T1, T2>
			where T1 : IResource
			where T2 : IResource
		{
			if (ReferenceEquals(first, second))
				return true;
			if (first == null || second == null)
				return false;
			return first.SequenceEqual(second, new LinkComparer<T, T1, T2>());
		}

		public static Expression<T> Convert<T>([CanBeNull] this Expression expr)
			where T : Delegate
		{
			Expression<T> e = expr switch
			{
				null => null,
				LambdaExpression lambda => new ExpressionConverter<T>(lambda).VisitAndConvert(),
				_ => throw new ArgumentException("Can't convert a non lambda.")
			};

			return ExpressionRewrite.Rewrite<T>(e);
		}

		private class ExpressionConverter<TTo> : ExpressionVisitor
			where TTo : Delegate
		{
			private readonly LambdaExpression _expression;
			private readonly ParameterExpression[] _newParams;
			
			internal ExpressionConverter(LambdaExpression expression)
			{
				_expression = expression;

				Type[] paramTypes = typeof(TTo).GetGenericArguments()[..^1];
				if (paramTypes.Length != _expression.Parameters.Count)
					throw new ArgumentException("Parameter count from internal and external lambda are not matched.");
				
				_newParams = new ParameterExpression[paramTypes.Length];
				for (int i = 0; i < paramTypes.Length; i++)
				{
					if (_expression.Parameters[i].Type == paramTypes[i])
						_newParams[i] = _expression.Parameters[i];
					else
						_newParams[i] = Expression.Parameter(paramTypes[i], _expression.Parameters[i].Name);
				}
			}

			internal Expression<TTo> VisitAndConvert()
			{
				Type returnType = _expression.Type.GetGenericArguments().Last();
				Expression body = _expression.ReturnType == returnType
					? Visit(_expression.Body)
					: Expression.Convert(Visit(_expression.Body)!, returnType);
				return Expression.Lambda<TTo>(body!, _newParams);
			}

			protected override Expression VisitParameter(ParameterExpression node)
			{
				return _newParams.FirstOrDefault(x => x.Name == node.Name) ?? node;
			}
		}
	}
}