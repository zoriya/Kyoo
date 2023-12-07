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
using JetBrains.Annotations;

namespace Kyoo.Utils
{
	/// <summary>
	/// A set of extensions class for enumerable.
	/// </summary>
	public static class EnumerableExtensions
	{
		/// <summary>
		/// If the enumerable is empty, execute an action.
		/// </summary>
		/// <param name="self">The enumerable to check</param>
		/// <param name="action">The action to execute is the list is empty</param>
		/// <typeparam name="T">The type of items inside the list</typeparam>
		/// <returns>The iterator proxied, there is no dual iterations.</returns>
		[LinqTunnel]
		public static IEnumerable<T> IfEmpty<T>(this IEnumerable<T> self, Action action)
		{
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
				} while (enumerator.MoveNext());
			}

			return Generator(self, action);
		}

		/// <summary>
		/// A foreach used as a function with a little specificity: the list can be null.
		/// </summary>
		/// <param name="self">The list to enumerate. If this is null, the function result in a no-op</param>
		/// <param name="action">The action to execute for each arguments</param>
		/// <typeparam name="T">The type of items in the list</typeparam>
		public static void ForEach<T>(this IEnumerable<T>? self, Action<T> action)
		{
			if (self == null)
				return;
			foreach (T i in self)
				action(i);
		}
	}
}
