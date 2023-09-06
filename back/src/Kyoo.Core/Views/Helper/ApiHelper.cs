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
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using JetBrains.Annotations;
using Kyoo.Abstractions.Models;
using Kyoo.Utils;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// A static class containing methods to parse the <c>where</c> query string.
	/// </summary>
	public static class ApiHelper
	{
		/// <summary>
		/// Make an expression (like
		/// <see cref="Expression.LessThan(System.Linq.Expressions.Expression,System.Linq.Expressions.Expression)"/>
		/// compatible with strings). If the expressions are not strings, the given <paramref name="operand"/> is
		/// constructed but if the expressions are strings, this method make the <paramref name="operand"/> compatible with
		/// strings.
		/// </summary>
		/// <param name="operand">
		/// The expression to make compatible. It should be something like
		/// <see cref="Expression.LessThan(System.Linq.Expressions.Expression,System.Linq.Expressions.Expression)"/> or
		/// <see cref="Expression.Equal(System.Linq.Expressions.Expression,System.Linq.Expressions.Expression)"/>.
		/// </param>
		/// <param name="left">The first parameter to compare.</param>
		/// <param name="right">The second parameter to compare.</param>
		/// <returns>A comparison expression compatible with strings</returns>
		public static BinaryExpression StringCompatibleExpression(
			[NotNull] Func<Expression, Expression, BinaryExpression> operand,
			[NotNull] Expression left,
			[NotNull] Expression right)
		{
			if (left is not MemberExpression member || ((PropertyInfo)member.Member).PropertyType != typeof(string))
				return operand(left, right);
			MethodCallExpression call = Expression.Call(typeof(string), "Compare", null, left, right);
			return operand(call, Expression.Constant(0));
		}

		/// <summary>
		/// Parse a <c>where</c> query for the given <typeparamref name="T"/>. Items can be filtered by any property
		/// of the given type.
		/// </summary>
		/// <param name="where">The list of filters.</param>
		/// <param name="defaultWhere">
		/// A custom expression to initially filter a collection. It will be combined with the parsed expression.
		/// </param>
		/// <typeparam name="T">The type to create filters for.</typeparam>
		/// <exception cref="ArgumentException">A filter is invalid.</exception>
		/// <returns>An expression representing the filters that can be used anywhere or compiled</returns>
		public static Expression<Func<T, bool>> ParseWhere<T>(Dictionary<string, string> where,
			Expression<Func<T, bool>> defaultWhere = null)
		{
			if (where == null || where.Count == 0)
				return defaultWhere;

			ParameterExpression param = defaultWhere?.Parameters.First() ?? Expression.Parameter(typeof(T));
			Expression expression = defaultWhere?.Body;

			foreach ((string key, string desired) in where)
			{
				if (key == null || desired == null)
					throw new ArgumentException("Invalid key/value pair. Can't be null.");

				string value = desired;
				string operand = "eq";
				if (desired.Contains(':'))
				{
					operand = desired.Substring(0, desired.IndexOf(':'));
					value = desired.Substring(desired.IndexOf(':') + 1);
				}

				PropertyInfo property = typeof(T).GetProperty(key, BindingFlags.Instance | BindingFlags.Public | BindingFlags.IgnoreCase);
				if (property == null)
					throw new ArgumentException($"No filterable parameter with the name {key}.");
				MemberExpression propertyExpr = Expression.Property(param, property);

				ConstantExpression valueExpr = null;
				bool isList = typeof(IEnumerable).IsAssignableFrom(propertyExpr.Type) && propertyExpr.Type != typeof(string);
				if (operand != "ctn" && !typeof(IResource).IsAssignableFrom(propertyExpr.Type) && !isList)
				{
					Type propertyType = Nullable.GetUnderlyingType(property.PropertyType) ?? property.PropertyType;
					object val;
					try
					{
						val = string.IsNullOrEmpty(value) || value.Equals("null", StringComparison.OrdinalIgnoreCase)
							? null
							: Convert.ChangeType(value, propertyType);
					}
					catch (InvalidCastException)
					{
						throw new ArgumentException("Comparing two differents value's type.");
					}

					valueExpr = Expression.Constant(val, property.PropertyType);
				}

				Expression condition = operand switch
				{
					"eq" when isList => _ContainsResourceExpression(propertyExpr, value),
					"ctn" => _ContainsResourceExpression(propertyExpr, value),

					"eq" when valueExpr == null => _ResourceEqual(propertyExpr, value),
					"not" when valueExpr == null => _ResourceEqual(propertyExpr, value, true),

					"eq" => Expression.Equal(propertyExpr, valueExpr),
					"not" => Expression.NotEqual(propertyExpr, valueExpr),
					"lt" => StringCompatibleExpression(Expression.LessThan, propertyExpr, valueExpr!),
					"lte" => StringCompatibleExpression(Expression.LessThanOrEqual, propertyExpr, valueExpr!),
					"gt" => StringCompatibleExpression(Expression.GreaterThan, propertyExpr, valueExpr!),
					"gte" => StringCompatibleExpression(Expression.GreaterThanOrEqual, propertyExpr, valueExpr!),
					_ => throw new ArgumentException($"Invalid operand: {operand}")
				};

				expression = expression != null
					? Expression.AndAlso(expression, condition)
					: condition;
			}

			return Expression.Lambda<Func<T, bool>>(expression!, param);
		}

		private static Expression _ResourceEqual(Expression parameter, string value, bool notEqual = false)
		{
			MemberExpression field;
			ConstantExpression valueConst;
			if (int.TryParse(value, out int id))
			{
				field = Expression.Property(parameter, "ID");
				valueConst = Expression.Constant(id);
			}
			else
			{
				field = Expression.Property(parameter, "Slug");
				valueConst = Expression.Constant(value);
			}

			return notEqual
				? Expression.NotEqual(field, valueConst)
				: Expression.Equal(field, valueConst);
		}

		private static Expression _ContainsResourceExpression(MemberExpression xProperty, string value)
		{
			if (xProperty.Type == typeof(string))
			{
				// x.PROPRETY.Contains(value);
				return Expression.Call(xProperty, typeof(string).GetMethod("Contains", new[] { typeof(string) }), Expression.Constant(value));
			}

			// x.PROPERTY is either a List<> or a []
			Type inner = xProperty.Type.GetElementType() ?? xProperty.Type.GenericTypeArguments.First();

			if (inner.IsAssignableTo(typeof(string)))
			{
				return Expression.Call(typeof(Enumerable), "Contains", new[] { inner }, xProperty, Expression.Constant(value));
			}
			else if (inner.IsEnum && Enum.TryParse(inner, value, true, out object enumValue))
			{
				return Expression.Call(typeof(Enumerable), "Contains", new[] { inner }, xProperty, Expression.Constant(enumValue));
			}

			if (!inner.IsAssignableTo(typeof(IResource)))
				throw new ArgumentException("Contain (ctn) not appliable for this property.");

			// x => x.PROPERTY.Any(y => y.Slug == value)
			Expression ret = null;
			ParameterExpression y = Expression.Parameter(inner, "y");
			foreach (string val in value.Split(','))
			{
				LambdaExpression lambda = Expression.Lambda(_ResourceEqual(y, val), y);
				Expression iteration = Expression.Call(typeof(Enumerable), "Any", new[] { inner }, xProperty, lambda);

				if (ret == null)
					ret = iteration;
				else
					ret = Expression.AndAlso(ret, iteration);
			}
			return ret;
		}
	}
}
