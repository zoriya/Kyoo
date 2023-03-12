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
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using Kyoo.Utils;

namespace Kyoo.Abstractions.Controllers
{
	/// <summary>
	/// Information about how a query should be sorted. What factor should decide the sort and in which order.
	/// </summary>
	/// <typeparam name="T">For witch type this sort applies</typeparam>
	public record Sort<T>
	{
		/// <summary>
		/// Sort by a specific key
		/// </summary>
		/// <param name="key">The sort keys. This members will be used to sort the results.</param>
		/// <param name="desendant">
		/// If this is set to true, items will be sorted in descend order else, they will be sorted in ascendant order.
		/// </param>
		public record By(string key, bool desendant = false) : Sort<T>
		{
			/// <summary>
			/// Sort by a specific key
			/// </summary>
			/// <param name="key">The sort keys. This members will be used to sort the results.</param>
			/// <param name="desendant">
			/// If this is set to true, items will be sorted in descend order else, they will be sorted in ascendant order.
			/// </param>
			public By(Expression<Func<T, object>> key, bool desendant = false)
				: this(Utility.GetPropertyName(key), desendant) { }

			/// <summary>
			/// Create a new <see cref="Sort{T}"/> instance from a key's name (case insensitive).
			/// </summary>
			/// <param name="sortBy">A key name with an optional order specifier. Format: "key:asc", "key:desc" or "key".</param>
			/// <exception cref="ArgumentException">An invalid key or sort specifier as been given.</exception>
			/// <returns>A <see cref="Sort{T}"/> for the given string</returns>
			public static new By From(string sortBy)
			{
				string key = sortBy.Contains(':') ? sortBy[..sortBy.IndexOf(':')] : sortBy;
				string order = sortBy.Contains(':') ? sortBy[(sortBy.IndexOf(':') + 1)..] : null;
				bool desendant = order switch
				{
					"desc" => true,
					"asc" => false,
					null => false,
					_ => throw new ArgumentException($"The sort order, if set, should be :asc or :desc but it was :{order}.")
				};
				PropertyInfo property = typeof(T).GetProperty(key, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
				if (property == null)
					throw new ArgumentException("The given sort key is not valid.");
				return new By(property.Name, desendant);
			}
		}

		/// <summary>
		/// Sort by multiple keys.
		/// </summary>
		/// <param name="list">The list of keys to sort by.</param>
		public record Conglomerate(params By[] list) : Sort<T>;

		/// <summary>The default sort method for the given type.</summary>
		public record Default : Sort<T>;

		/// <summary>
		/// Create a new <see cref="Sort{T}"/> instance from a key's name (case insensitive).
		/// </summary>
		/// <param name="sortBy">A key name with an optional order specifier. Format: "key:asc", "key:desc" or "key".</param>
		/// <exception cref="ArgumentException">An invalid key or sort specifier as been given.</exception>
		/// <returns>A <see cref="Sort{T}"/> for the given string</returns>
		public static Sort<T> From(string sortBy)
		{
			if (string.IsNullOrEmpty(sortBy))
				return new Default();
			if (sortBy.Contains(','))
				return new Conglomerate(sortBy.Split(',').Select(By.From).ToArray());
			return By.From(sortBy);
		}
	}
}
