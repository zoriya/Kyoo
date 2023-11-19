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
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Utils;

namespace Kyoo.Abstractions.Controllers
{
	public record Sort;

	/// <summary>
	/// Information about how a query should be sorted. What factor should decide the sort and in which order.
	/// </summary>
	/// <typeparam name="T">For witch type this sort applies</typeparam>
	public record Sort<T> : Sort
		where T : IQuery
	{
		/// <summary>
		/// Sort by a specific key
		/// </summary>
		/// <param name="Key">The sort keys. This members will be used to sort the results.</param>
		/// <param name="Desendant">
		/// If this is set to true, items will be sorted in descend order else, they will be sorted in ascendant order.
		/// </param>
		public record By(string Key, bool Desendant = false) : Sort<T>
		{
			/// <summary>
			/// Sort by a specific key
			/// </summary>
			/// <param name="key">The sort keys. This members will be used to sort the results.</param>
			/// <param name="desendant">
			/// If this is set to true, items will be sorted in descend order else, they will be sorted in ascendant order.
			/// </param>
			public By(Expression<Func<T, object?>> key, bool desendant = false)
				: this(Utility.GetPropertyName(key), desendant) { }
		}

		/// <summary>
		/// Sort by multiple keys.
		/// </summary>
		/// <param name="List">The list of keys to sort by.</param>
		public record Conglomerate(params Sort<T>[] List) : Sort<T>;

		/// <summary>Sort randomly items</summary>
		public record Random(uint seed) : Sort<T>;

		/// <summary>The default sort method for the given type.</summary>
		public record Default : Sort<T>
		{
			public void Deconstruct(out Sort<T> value)
			{
				value = (Sort<T>)T.DefaultSort;
			}
		}

		/// <summary>
		/// Create a new <see cref="Sort{T}"/> instance from a key's name (case insensitive).
		/// </summary>
		/// <param name="sortBy">A key name with an optional order specifier. Format: "key:asc", "key:desc" or "key".</param>
		/// <param name="seed">The random seed.</param>
		/// <exception cref="ArgumentException">An invalid key or sort specifier as been given.</exception>
		/// <returns>A <see cref="Sort{T}"/> for the given string</returns>
		public static Sort<T> From(string? sortBy, uint seed)
		{
			if (string.IsNullOrEmpty(sortBy) || sortBy == "default")
				return new Default();
			if (sortBy == "random")
				return new Random(seed);
			if (sortBy.Contains(','))
				return new Conglomerate(sortBy.Split(',').Select(x => From(x, seed)).ToArray());

			if (sortBy.StartsWith("random:"))
				return new Random(uint.Parse(sortBy["random:".Length..]));

			string key = sortBy.Contains(':') ? sortBy[..sortBy.IndexOf(':')] : sortBy;
			string? order = sortBy.Contains(':') ? sortBy[(sortBy.IndexOf(':') + 1)..] : null;
			bool desendant = order switch
			{
				"desc" => true,
				"asc" => false,
				null => false,
				_ => throw new ValidationException($"The sort order, if set, should be :asc or :desc but it was :{order}.")
			};

			Type[] types = typeof(T).GetCustomAttribute<OneOfAttribute>()?.Types ?? new[] { typeof(T) };
			PropertyInfo? property = types
				.Select(x => x.GetProperty(key, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance))
				.FirstOrDefault();
			if (property == null)
				throw new ValidationException("The given sort key is not valid.");
			return new By(property.Name, desendant);
		}
	}
}
