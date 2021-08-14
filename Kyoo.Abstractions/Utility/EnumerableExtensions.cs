using System;
using System.Collections;
using System.Collections.Generic;
using System.Threading.Tasks;
using JetBrains.Annotations;

namespace Kyoo
{
	/// <summary>
	/// A set of extensions class for enumerable.
	/// </summary>
	public static class EnumerableExtensions
	{
		/// <summary>
		/// A Select where the index of the item can be used.
		/// </summary>
		/// <param name="self">The IEnumerable to map. If self is null, an empty list is returned</param>
		/// <param name="mapper">The function that will map each items</param>
		/// <typeparam name="T">The type of items in <see cref="self"/></typeparam>
		/// <typeparam name="T2">The type of items in the returned list</typeparam>
		/// <returns>The list mapped.</returns>
		/// <exception cref="ArgumentNullException">The list or the mapper can't be null</exception>
		[LinqTunnel]
		public static IEnumerable<T2> Map<T, T2>([NotNull] this IEnumerable<T> self,
			[NotNull] Func<T, int, T2> mapper)
		{
			if (self == null)
				throw new ArgumentNullException(nameof(self));
			if (mapper == null)
				throw new ArgumentNullException(nameof(mapper));

			static IEnumerable<T2> Generator(IEnumerable<T> self, Func<T, int, T2> mapper)
			{
				using IEnumerator<T> enumerator = self.GetEnumerator();
				int index = 0;

				while (enumerator.MoveNext())
				{
					yield return mapper(enumerator.Current, index);
					index++;
				}
			}
			return Generator(self, mapper);
		}
		
		/// <summary>
		/// A map where the mapping function is asynchronous.
		/// Note: <see cref="SelectAsync{T,T2}"/> might interest you. 
		/// </summary>
		/// <param name="self">The IEnumerable to map.</param>
		/// <param name="mapper">The asynchronous function that will map each items</param>
		/// <typeparam name="T">The type of items in <see cref="self"/></typeparam>
		/// <typeparam name="T2">The type of items in the returned list</typeparam>
		/// <returns>The list mapped as an AsyncEnumerable</returns>
		/// <exception cref="ArgumentNullException">The list or the mapper can't be null</exception>
		[LinqTunnel]
		public static IAsyncEnumerable<T2> MapAsync<T, T2>([NotNull] this IEnumerable<T> self, 
			[NotNull] Func<T, int, Task<T2>> mapper)
		{
			if (self == null)
				throw new ArgumentNullException(nameof(self));
			if (mapper == null)
				throw new ArgumentNullException(nameof(mapper));

			static async IAsyncEnumerable<T2> Generator(IEnumerable<T> self, Func<T, int, Task<T2>> mapper)
			{
				using IEnumerator<T> enumerator = self.GetEnumerator();
				int index = 0;

				while (enumerator.MoveNext())
				{
					yield return await mapper(enumerator.Current, index);
					index++;
				}
			}

			return Generator(self, mapper);
		}
		
		/// <summary>
		/// An asynchronous version of Select.
		/// </summary>
		/// <param name="self">The IEnumerable to map</param>
		/// <param name="mapper">The asynchronous function that will map each items</param>
		/// <typeparam name="T">The type of items in <see cref="self"/></typeparam>
		/// <typeparam name="T2">The type of items in the returned list</typeparam>
		/// <returns>The list mapped as an AsyncEnumerable</returns>
		/// <exception cref="ArgumentNullException">The list or the mapper can't be null</exception>
		[LinqTunnel]
		public static IAsyncEnumerable<T2> SelectAsync<T, T2>([NotNull] this IEnumerable<T> self, 
			[NotNull] Func<T, Task<T2>> mapper)
		{
			if (self == null)
				throw new ArgumentNullException(nameof(self));
			if (mapper == null)
				throw new ArgumentNullException(nameof(mapper));

			static async IAsyncEnumerable<T2> Generator(IEnumerable<T> self, Func<T, Task<T2>> mapper)
			{
				using IEnumerator<T> enumerator = self.GetEnumerator();

				while (enumerator.MoveNext())
					yield return await mapper(enumerator.Current);
			}

			return Generator(self, mapper);
		}

		/// <summary>
		/// Convert an AsyncEnumerable to a List by waiting for every item.
		/// </summary>
		/// <param name="self">The async list</param>
		/// <typeparam name="T">The type of items in the async list and in the returned list.</typeparam>
		/// <returns>A task that will return a simple list</returns>
		/// <exception cref="ArgumentNullException">The list can't be null</exception>
		[LinqTunnel]
		public static Task<List<T>> ToListAsync<T>([NotNull] this IAsyncEnumerable<T> self)
		{
			if (self == null)
				throw new ArgumentNullException(nameof(self));

			static async Task<List<T>> ToList(IAsyncEnumerable<T> self)
			{
				List<T> ret = new();
				await foreach (T i in self)
					ret.Add(i);
				return ret;
			}

			return ToList(self);
		}

		/// <summary>
		/// If the enumerable is empty, execute an action.
		/// </summary>
		/// <param name="self">The enumerable to check</param>
		/// <param name="action">The action to execute is the list is empty</param>
		/// <typeparam name="T">The type of items inside the list</typeparam>
		/// <exception cref="ArgumentNullException">The iterable and the action can't be null.</exception>
		/// <returns>The iterator proxied, there is no dual iterations.</returns>
		[LinqTunnel]
		public static IEnumerable<T> IfEmpty<T>([NotNull] this IEnumerable<T> self, [NotNull] Action action)
		{
			if (self == null)
				throw new ArgumentNullException(nameof(self));
			if (action == null)
				throw new ArgumentNullException(nameof(action));

			static IEnumerable<T> Generator(IEnumerable<T> self, Action action)
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

			return Generator(self, action);
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
		
		/// <summary>
		/// A foreach used as a function with a little specificity: the list can be null.
		/// </summary>
		/// <param name="self">The list to enumerate. If this is null, the function result in a no-op</param>
		/// <param name="action">The action to execute for each arguments</param>
		public static async Task ForEachAsync([CanBeNull] this IEnumerable self, Func<object, Task> action)
		{
			if (self == null)
				return;
			foreach (object i in self)
				await action(i);
		}
		
		/// <summary>
		/// A foreach used as a function with a little specificity: the list can be null.
		/// </summary>
		/// <param name="self">The list to enumerate. If this is null, the function result in a no-op</param>
		/// <param name="action">The asynchronous action to execute for each arguments</param>
		/// <typeparam name="T">The type of items in the list.</typeparam>
		public static async Task ForEachAsync<T>([CanBeNull] this IEnumerable<T> self, Func<T, Task> action)
		{
			if (self == null)
				return;
			foreach (T i in self)
				await action(i);
		}
		
		/// <summary>
		/// A foreach used as a function with a little specificity: the list can be null.
		/// </summary>
		/// <param name="self">The async list to enumerate. If this is null, the function result in a no-op</param>
		/// <param name="action">The action to execute for each arguments</param>
		/// <typeparam name="T">The type of items in the list.</typeparam>
		public static async Task ForEachAsync<T>([CanBeNull] this IAsyncEnumerable<T> self, Action<T> action)
		{
			if (self == null)
				return;
			await foreach (T i in self)
				action(i);
		}
		
		/// <summary>
		/// Split a list in a small chunk of data.
		/// </summary>
		/// <param name="list">The list to split</param>
		/// <param name="countPerList">The number of items in each chunk</param>
		/// <typeparam name="T">The type of data in the initial list.</typeparam>
		/// <returns>A list of chunks</returns>
		[LinqTunnel]
		public static IEnumerable<List<T>> BatchBy<T>(this List<T> list, int countPerList)
		{
			for (int i = 0; i < list.Count; i += countPerList)
				yield return list.GetRange(i, Math.Min(list.Count - i, countPerList));
		}
		
		/// <summary>
		/// Split a list in a small chunk of data.
		/// </summary>
		/// <param name="list">The list to split</param>
		/// <param name="countPerList">The number of items in each chunk</param>
		/// <typeparam name="T">The type of data in the initial list.</typeparam>
		/// <returns>A list of chunks</returns>
		[LinqTunnel]
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
	}
}