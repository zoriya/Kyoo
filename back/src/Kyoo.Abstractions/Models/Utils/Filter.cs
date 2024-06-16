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
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using Kyoo.Abstractions.Models.Attributes;
using Sprache;

namespace Kyoo.Abstractions.Models.Utils;

public static class ParseHelper
{
	public static Parser<T> ErrorMessage<T>(this Parser<T> @this, string message) =>
		input =>
		{
			IResult<T> result = @this(input);

			return result.WasSuccessful
				? result
				: Result.Failure<T>(result.Remainder, message, result.Expectations);
		};

	public static Parser<T> Error<T>(string message) =>
		input =>
		{
			return Result.Failure<T>(input, message, Array.Empty<string>());
		};
}

public abstract record Filter
{
	public static Filter<T>? And<T>(params Filter<T>?[] filters)
	{
		return filters
			.Where(x => x != null)
			.Aggregate(
				(Filter<T>?)null,
				(acc, filter) =>
				{
					if (acc == null)
						return filter;
					return new Filter<T>.And(acc, filter!);
				}
			);
	}

	public static Filter<T>? Or<T>(params Filter<T>?[] filters)
	{
		return filters
			.Where(x => x != null)
			.Aggregate(
				(Filter<T>?)null,
				(acc, filter) =>
				{
					if (acc == null)
						return filter;
					return new Filter<T>.Or(acc, filter!);
				}
			);
	}
}

public abstract record Filter<T> : Filter
{
	public record And(Filter<T> First, Filter<T> Second) : Filter<T>;

	public record Or(Filter<T> First, Filter<T> Second) : Filter<T>;

	public record Not(Filter<T> Filter) : Filter<T>;

	public record Eq(string Property, object? Value) : Filter<T>;

	public record Ne(string Property, object? Value) : Filter<T>;

	public record Gt(string Property, object Value) : Filter<T>;

	public record Ge(string Property, object Value) : Filter<T>;

	public record Lt(string Property, object Value) : Filter<T>;

	public record Le(string Property, object Value) : Filter<T>;

	public record Has(string Property, object Value) : Filter<T>;

	/// <summary>
	/// Internal filter used for keyset paginations to resume random sorts.
	/// The pseudo sql is md5(seed || table.id) = md5(seed || 'hardCodedId')
	/// </summary>
	public record CmpRandom(string cmp, string Seed, Guid ReferenceId) : Filter<T>;

	/// <summary>
	/// Internal filter used only in EF with hard coded lamdas (used for relations).
	/// </summary>
	public record Lambda(Expression<Func<T, bool>> Inner) : Filter<T>;

	public static class FilterParsers
	{
		public static readonly Parser<Filter<T>> Filter = Parse
			.Ref(() => Bracket)
			.Or(Parse.Ref(() => Not))
			.Or(Parse.Ref(() => Eq))
			.Or(Parse.Ref(() => Ne))
			.Or(Parse.Ref(() => Gt))
			.Or(Parse.Ref(() => Ge))
			.Or(Parse.Ref(() => Lt))
			.Or(Parse.Ref(() => Le))
			.Or(Parse.Ref(() => Has));

		public static readonly Parser<Filter<T>> CompleteFilter = Parse
			.Ref(() => Or)
			.Or(Parse.Ref(() => And))
			.Or(Filter);

		public static readonly Parser<Filter<T>> Bracket =
			from open in Parse.Char('(').Token()
			from filter in CompleteFilter
			from close in Parse.Char(')').Token()
			select filter;

		public static readonly Parser<IEnumerable<char>> AndOperator = Parse
			.IgnoreCase("and")
			.Or(Parse.String("&&"))
			.Token();

		public static readonly Parser<IEnumerable<char>> OrOperator = Parse
			.IgnoreCase("or")
			.Or(Parse.String("||"))
			.Token();

		public static readonly Parser<Filter<T>> And = Parse.ChainOperator(
			AndOperator,
			Filter,
			(_, a, b) => new And(a, b)
		);

		public static readonly Parser<Filter<T>> Or = Parse.ChainOperator(
			OrOperator,
			And.Or(Filter),
			(_, a, b) => new Or(a, b)
		);

		public static readonly Parser<Filter<T>> Not =
			from not in Parse.IgnoreCase("not").Or(Parse.String("!")).Token()
			from filter in CompleteFilter
			select new Not(filter);

		private static Parser<object> _GetValueParser(Type type)
		{
			Type? nullable = Nullable.GetUnderlyingType(type);
			if (nullable != null)
			{
				return from value in _GetValueParser(nullable) select value;
			}

			if (type == typeof(int))
				return Parse.Number.Select(x => int.Parse(x) as object);

			if (type == typeof(float))
			{
				return from a in Parse.Number
					from dot in Parse.Char('.')
					from b in Parse.Number
					select float.Parse($"{a}.{b}") as object;
			}

			if (type == typeof(Guid))
			{
				return from guid in Parse.Regex(
						@"[({]?[a-fA-F0-9]{8}[-]?([a-fA-F0-9]{4}[-]?){3}[a-fA-F0-9]{12}[})]?",
						"Guid"
					)
					select Guid.Parse(guid) as object;
			}

			if (type == typeof(string))
			{
				return (
					from lq in Parse.Char('"').Or(Parse.Char('\''))
					from str in Parse.AnyChar.Where(x => x != lq).Many().Text()
					from rq in Parse.Char(lq)
					select str
				).Or(Parse.LetterOrDigit.Many().Text());
			}

			if (type.IsEnum)
			{
				return Parse
					.LetterOrDigit.Many()
					.Text()
					.Then(x =>
					{
						if (Enum.TryParse(type, x, true, out object? value))
							return Parse.Return(value);
						return ParseHelper.Error<object>($"Invalid enum value. Unexpected {x}");
					});
			}

			if (type == typeof(DateTime) || type == typeof(DateOnly))
			{
				return from year in Parse.Digit.Repeat(4).Text().Select(int.Parse)
					from yd in Parse.Char('-')
					from month in Parse.Digit.Repeat(2).Text().Select(int.Parse)
					from md in Parse.Char('-')
					from day in Parse.Digit.Repeat(2).Text().Select(int.Parse)
					select type == typeof(DateTime)
						? new DateTime(year, month, day) as object
						: new DateOnly(year, month, day) as object;
			}

			if (typeof(IEnumerable).IsAssignableFrom(type))
				return ParseHelper.Error<object>(
					"Can't filter a list with a default comparator, use the 'has' filter."
				);
			return ParseHelper.Error<object>("Unfilterable field found");
		}

		private static Parser<Filter<T>> _GetOperationParser(
			Parser<object> op,
			Func<string, object, Filter<T>> apply,
			Func<Type, Parser<object?>>? customTypeParser = null
		)
		{
			Parser<string> property = Parse.LetterOrDigit.AtLeastOnce().Text();

			return property.Then(prop =>
			{
				Type[] types =
					typeof(T).GetCustomAttribute<OneOfAttribute>()?.Types ?? new[] { typeof(T) };

				if (string.Equals(prop, "kind", StringComparison.OrdinalIgnoreCase))
				{
					return from eq in op
						from val in types
							.Select(x => Parse.IgnoreCase(x.Name).Text())
							.Aggregate(
								null as Parser<string>,
								(acc, x) => acc == null ? x : Parse.Or(acc, x)
							)
						select apply("kind", val);
				}

				PropertyInfo? propInfo = types
					.Select(x =>
						x.GetProperty(
							prop,
							BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance
						)
					)
					.FirstOrDefault();
				if (propInfo == null)
					return ParseHelper.Error<Filter<T>>($"The given filter '{prop}' is invalid.");

				Parser<object?> value =
					customTypeParser != null
						? customTypeParser(propInfo.PropertyType)
						: _GetValueParser(propInfo.PropertyType);

				return from eq in op
					from val in value
					select apply(propInfo.Name, val);
			});
		}

		public static readonly Parser<Filter<T>> Eq = _GetOperationParser(
			Parse.IgnoreCase("eq").Or(Parse.String("=")).Token(),
			(property, value) => new Eq(property, value),
			(Type type) =>
			{
				Type? inner = Nullable.GetUnderlyingType(type);
				if (inner == null)
					return _GetValueParser(type);
				return Parse
					.String("null")
					.Token()
					.Return((object?)null)
					.Or(_GetValueParser(inner));
			}
		);

		public static readonly Parser<Filter<T>> Ne = _GetOperationParser(
			Parse.IgnoreCase("ne").Or(Parse.String("!=")).Token(),
			(property, value) => new Ne(property, value),
			(Type type) =>
			{
				Type? inner = Nullable.GetUnderlyingType(type);
				if (inner == null)
					return _GetValueParser(type);
				return Parse
					.String("null")
					.Token()
					.Return((object?)null)
					.Or(_GetValueParser(inner));
			}
		);

		public static readonly Parser<Filter<T>> Gt = _GetOperationParser(
			Parse.IgnoreCase("gt").Or(Parse.String(">")).Token(),
			(property, value) => new Gt(property, value)
		);

		public static readonly Parser<Filter<T>> Ge = _GetOperationParser(
			Parse.IgnoreCase("ge").Or(Parse.IgnoreCase("gte")).Or(Parse.String(">=")).Token(),
			(property, value) => new Ge(property, value)
		);

		public static readonly Parser<Filter<T>> Lt = _GetOperationParser(
			Parse.IgnoreCase("lt").Or(Parse.String("<")).Token(),
			(property, value) => new Lt(property, value)
		);

		public static readonly Parser<Filter<T>> Le = _GetOperationParser(
			Parse.IgnoreCase("le").Or(Parse.IgnoreCase("lte")).Or(Parse.String("<=")).Token(),
			(property, value) => new Le(property, value)
		);

		public static readonly Parser<Filter<T>> Has = _GetOperationParser(
			Parse.IgnoreCase("has").Token(),
			(property, value) => new Has(property, value),
			(Type type) =>
			{
				if (typeof(IEnumerable).IsAssignableFrom(type) && type != typeof(string))
					return _GetValueParser(
						type.GetElementType() ?? type.GenericTypeArguments.First()
					);
				return ParseHelper.Error<object>("Can't use 'has' on a non-list.");
			}
		);
	}

	public static Filter<T>? From(string? filter)
	{
		if (filter == null)
			return null;

		try
		{
			IResult<Filter<T>> ret = FilterParsers.CompleteFilter.End().TryParse(filter);
			if (ret.WasSuccessful)
				return ret.Value;
			throw new ValidationException(
				$"Could not parse filter argument: {ret.Message}. Not parsed: {filter[ret.Remainder.Position..]}"
			);
		}
		catch (ParseException ex)
		{
			throw new ValidationException($"Could not parse filter argument: {ex.Message}.");
		}
	}
}
