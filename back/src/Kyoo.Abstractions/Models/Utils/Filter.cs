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
namespace Kyoo.Abstractions.Models.Utils;

public abstract record Filter
{
	public static Filter<T>? And<T>(params Filter<T>?[] filters)
	{
		return filters
			.Where(x => x != null)
			.Aggregate((Filter<T>?)null, (acc, filter) =>
			{
				if (acc == null)
					return filter;
				return new Filter<T>.And(acc, filter!);
			});
	}
}

public abstract record Filter<T> : Filter
{
	public record And(Filter<T> first, Filter<T> second) : Filter<T>;

	public record Or(Filter<T> first, Filter<T> second) : Filter<T>;

	public record Not(Filter<T> filter) : Filter<T>;

	public record Eq(string property, object value) : Filter<T>;

	public record Ne<T2>(string property, T2 value) : Filter<T>;

	public record Gt<T2>(string property, T2 value) : Filter<T>;

	public record Ge<T2>(string property, T2 value) : Filter<T>;

	public record Lt<T2>(string property, T2 value) : Filter<T>;

	public record Le<T2>(string property, T2 value) : Filter<T>;

	public record Has<T2>(string property, T2 value) : Filter<T>;

	public record In(string property, object[] value) : Filter<T>;

	public record Lambda(Expression<Func<T, bool>> lambda) : Filter<T>;

	public static Filter<T> From(string filter)
	{

	}
}
