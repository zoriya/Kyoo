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
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using Sprache;

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

	public record Ne(string property, object value) : Filter<T>;

	public record Gt(string property, object value) : Filter<T>;

	public record Ge(string property, object value) : Filter<T>;

	public record Lt(string property, object value) : Filter<T>;

	public record Le(string property, object value) : Filter<T>;

	public record Has(string property, object value) : Filter<T>;

	public record In(string property, object[] value) : Filter<T>;

	public record Lambda(Expression<Func<T, bool>> lambda) : Filter<T>;

	public static class FilterParsers
	{
		public static readonly Parser<Filter<T>> Filter =
			Parse.Ref(() => Bracket)
				.Or(Parse.Ref(() => Not))
				.Or(Parse.Ref(() => Eq))
				.Or(Parse.Ref(() => Ne))
				.Or(Parse.Ref(() => Gt))
				.Or(Parse.Ref(() => Ge))
				.Or(Parse.Ref(() => Lt))
				.Or(Parse.Ref(() => Le));

		public static readonly Parser<Filter<T>> CompleteFilter =
			Parse.Ref(() => Or)
				.Or(Parse.Ref(() => And))
				.Or(Filter);

		public static readonly Parser<Filter<T>> Bracket =
			from open in Parse.Char('(').Token()
			from filter in CompleteFilter
			from close in Parse.Char(')').Token()
			select filter;

		public static readonly Parser<IEnumerable<char>> AndOperator = Parse.IgnoreCase("and")
			.Or(Parse.String("&&"))
			.Token();

		public static readonly Parser<IEnumerable<char>> OrOperator = Parse.IgnoreCase("or")
			.Or(Parse.String("||"))
			.Token();

		public static readonly Parser<Filter<T>> And = Parse.ChainOperator(AndOperator, Filter, (_, a, b) => new Filter<T>.And(a, b));

		public static readonly Parser<Filter<T>> Or = Parse.ChainOperator(OrOperator, And.Or(Filter), (_, a, b) => new Filter<T>.Or(a, b));

		public static readonly Parser<Filter<T>> Not =
			from not in Parse.IgnoreCase("not")
				.Or(Parse.String("!"))
				.Token()
			from filter in CompleteFilter
			select new Filter<T>.Not(filter);

		private static Parser<Filter<T>> _GetOperationParser(Parser<object> op, Func<string, object, Filter<T>> apply)
		{
			Parser<string> property = Parse.LetterOrDigit.AtLeastOnce().Text();

			return property.Then(prop =>
			{
				PropertyInfo? propInfo = typeof(T).GetProperty(prop, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
				if (propInfo == null)
					throw new ValidationException($"The given filter {property} is invalid.");

				Parser<object> value;

				if (propInfo.PropertyType == typeof(int))
					value = Parse.Number.Select(x => int.Parse(x) as object);
				else if (propInfo.PropertyType == typeof(float))
				{
					value =
						from a in Parse.Number
						from dot in Parse.Char('.')
						from b in Parse.Number
						select float.Parse($"{a}.{b}") as object;
				}
				else if (propInfo.PropertyType == typeof(string))
				{
					value = (
						from lq in Parse.Char('"').Or(Parse.Char('\''))
						from str in Parse.AnyChar.Where(x => x is not '"' and not '\'').Many().Text()
						from rq in Parse.Char('"').Or(Parse.Char('\''))
						select str
					).Or(Parse.LetterOrDigit.Many().Text());
				}
				else if (propInfo.PropertyType.IsEnum)
				{
					value = Parse.LetterOrDigit.Many().Text().Select(x =>
					{
						if (Enum.TryParse(propInfo.PropertyType, x, true, out object? value))
							return value!;
						throw new ValidationException($"Invalid enum value. Unexpected {x}");
					});
				}
				// TODO: Support arrays
				else
					throw new ValidationException("Unfilterable field found");

				return
					from eq in op
					from val in value
					select apply(prop, val);
			});
		}

		public static readonly Parser<Filter<T>> Eq = _GetOperationParser(
			Parse.IgnoreCase("eq").Or(Parse.String("=")).Token(),
			(property, value) => new Eq(property, value)
		);

		public static readonly Parser<Filter<T>> Ne = _GetOperationParser(
			Parse.IgnoreCase("ne").Or(Parse.String("!=")).Token(),
			(property, value) => new Ne(property, value)
		);

		public static readonly Parser<Filter<T>> Gt = _GetOperationParser(
			Parse.IgnoreCase("gt").Or(Parse.String(">")).Token(),
			(property, value) => new Gt(property, value)
		);

		public static readonly Parser<Filter<T>> Ge = _GetOperationParser(
			Parse.IgnoreCase("ge").Or(Parse.String(">=")).Token(),
			(property, value) => new Ge(property, value)
		);

		public static readonly Parser<Filter<T>> Lt = _GetOperationParser(
			Parse.IgnoreCase("lt").Or(Parse.String("<")).Token(),
			(property, value) => new Lt(property, value)
		);

		public static readonly Parser<Filter<T>> Le = _GetOperationParser(
			Parse.IgnoreCase("le").Or(Parse.String("<=")).Token(),
			(property, value) => new Le(property, value)
		);
	}

	public static Filter<T>? From(string? filter)
	{
		if (filter == null)
			return null;

		IResult<Filter<T>> ret = FilterParsers.CompleteFilter.End().TryParse(filter);
		if (ret.WasSuccessful)
			return ret.Value;
		throw new ValidationException($"Could not parse filter argument: {ret.Message}. Not parsed: {filter[ret.Remainder.Position..]}");
	}
}
