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
using System.Linq;
using System.Reflection;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Utils;

namespace Kyoo.Core;

public class RepositoryHelper
{
	private record SortIndicator(string Key, bool Desc, string? Seed);

	/// <summary>
	/// Create a filter (where) expression on the query to skip everything before/after the referenceID.
	/// The generalized expression for this in pseudocode is:
	///   (x > a) OR
	///   (x = a AND y > b) OR
	///   (x = a AND y = b AND z > c) OR...
	///
	/// Of course, this will be a bit more complex when ASC and DESC are mixed.
	/// Assume x is ASC, y is DESC, and z is ASC:
	///   (x > a) OR
	///   (x = a AND y &lt; b) OR
	///   (x = a AND y = b AND z > c) OR...
	/// </summary>
	/// <param name="sort">How items are sorted in the query</param>
	/// <param name="reference">The reference item (the AfterID query)</param>
	/// <param name="next">True if the following page should be returned, false for the previous.</param>
	/// <typeparam name="T">The type to paginate for.</typeparam>
	/// <returns>An expression ready to be added to a Where close of a sorted query to handle the AfterID</returns>
	public static Filter<T>? KeysetPaginate<T>(Sort<T>? sort, T reference, bool next = true)
		where T : class, IResource, IQuery
	{
		sort ??= new Sort<T>.Default();

		IEnumerable<SortIndicator> GetSortsBy(Sort<T> sort)
		{
			return sort switch
			{
				Sort<T>.Default(var value) => GetSortsBy(value),
				Sort<T>.By @sortBy => new[] { new SortIndicator(sortBy.Key, sortBy.Desendant, null) },
				Sort<T>.Conglomerate(var list) => list.SelectMany(GetSortsBy),
				Sort<T>.Random(var seed) => new[] { new SortIndicator("random", false, seed.ToString()) },
				_ => Array.Empty<SortIndicator>(),
			};
		}

		// Don't forget that every sorts must end with a ID sort (to differentiate equalities).
		IEnumerable<SortIndicator> sorts = GetSortsBy(sort)
			.Append(new SortIndicator("Id", false, null));

		Filter<T>? ret = null;
		List<SortIndicator> previousSteps = new();
		// TODO: Add an outer query >= for perf
		// PERF: See https://use-the-index-luke.com/sql/partial-results/fetch-next-page#sb-equivalent-logic
		foreach ((string key, bool desc, string? seed) in sorts)
		{
			object? value = reference.GetType().GetProperty(key)?.GetValue(reference);
			// Comparing a value with null always return false so we short opt < > comparisons with null.
			if (key != "random" && value == null)
			{
				previousSteps.Add(new SortIndicator(key, desc, seed));
				continue;
			}

			// Create all the equality statements for previous sorts.
			Filter<T>? equals = null;
			foreach ((string pKey, bool pDesc, string? pSeed) in previousSteps)
			{
				Filter<T> pEquals = pSeed == null
					? new Filter<T>.Eq(pKey, reference.GetType().GetProperty(pKey)?.GetValue(reference))
					: new Filter<T>.EqRandom(pSeed, reference.Id);
				equals = Filter.And(equals, pEquals);
			}

			bool greaterThan = desc ^ next;
			Func<string, object, Filter<T>> comparer = greaterThan
				? (prop, val) => new Filter<T>.Gt(prop, val)
				: (prop, val) => new Filter<T>.Lt(prop, val);
			Filter<T> last = seed == null
				? comparer(key, value!)
				: new Filter<T>.EqRandom(seed, reference.Id);

			if (key != "random")
			{
				Type[] types = typeof(T).GetCustomAttribute<OneOfAttribute>()?.Types ?? new[] { typeof(T) };
				PropertyInfo property = types.Select(x => x.GetProperty(key)!).First(x => x != null);
				if (Nullable.GetUnderlyingType(property.PropertyType) != null)
					last = new Filter<T>.Or(last, new Filter<T>.Eq(key, null));
			}

			ret = Filter.Or(ret, Filter.And(equals, last));
			previousSteps.Add(new SortIndicator(key, desc, seed));
		}
		return ret;
	}
}
