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
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Postgresql;
using Kyoo.Utils;

namespace Kyoo.Core.Controllers;

public static class EfHelpers
{
	public static Expression<Func<T, bool>> ToEfLambda<T>(this Filter<T>? filter)
	{
		if (filter == null)
			return x => true;

		ParameterExpression x = Expression.Parameter(typeof(T), "x");

		Expression CmpRandomHandler(string cmp, string seed, Guid refId)
		{
			MethodInfo concat = typeof(string).GetMethod(
				nameof(string.Concat),
				new[] { typeof(string), typeof(string) }
			)!;
			Expression id = Expression.Call(
				Expression.Property(x, "ID"),
				nameof(Guid.ToString),
				null
			);
			Expression xrng = Expression.Call(concat, Expression.Constant(seed), id);
			Expression left = Expression.Call(
				typeof(DatabaseContext),
				nameof(DatabaseContext.MD5),
				null,
				xrng
			);
			Expression right = Expression.Call(
				typeof(DatabaseContext),
				nameof(DatabaseContext.MD5),
				null,
				Expression.Constant($"{seed}{refId}")
			);
			return cmp switch
			{
				"=" => Expression.Equal(left, right),
				"<" => Expression.GreaterThan(left, right),
				">" => Expression.LessThan(left, right),
				_ => throw new NotImplementedException()
			};
		}

		BinaryExpression StringCompatibleExpression(
			Func<Expression, Expression, BinaryExpression> operand,
			string property,
			object value
		)
		{
			var left = Expression.Property(x, property);
			var right = Expression.Constant(value, ((PropertyInfo)left.Member).PropertyType);
			if (left.Type != typeof(string))
				return operand(left, right);
			MethodCallExpression call = Expression.Call(
				typeof(string),
				"Compare",
				null,
				left,
				right
			);
			return operand(call, Expression.Constant(0));
		}

		Expression Exp(
			Func<Expression, Expression, BinaryExpression> operand,
			string property,
			object? value
		)
		{
			var prop = Expression.Property(x, property);
			var val = Expression.Constant(value, ((PropertyInfo)prop.Member).PropertyType);
			return operand(prop, val);
		}

		Expression Parse(Filter<T> f)
		{
			return f switch
			{
				Filter<T>.And(var first, var second)
					=> Expression.AndAlso(Parse(first), Parse(second)),
				Filter<T>.Or(var first, var second)
					=> Expression.OrElse(Parse(first), Parse(second)),
				Filter<T>.Not(var inner) => Expression.Not(Parse(inner)),
				Filter<T>.Eq(var property, var value) => Exp(Expression.Equal, property, value),
				Filter<T>.Ne(var property, var value) => Exp(Expression.NotEqual, property, value),
				Filter<T>.Gt(var property, var value)
					=> StringCompatibleExpression(Expression.GreaterThan, property, value),
				Filter<T>.Ge(var property, var value)
					=> StringCompatibleExpression(Expression.GreaterThanOrEqual, property, value),
				Filter<T>.Lt(var property, var value)
					=> StringCompatibleExpression(Expression.LessThan, property, value),
				Filter<T>.Le(var property, var value)
					=> StringCompatibleExpression(Expression.LessThanOrEqual, property, value),
				Filter<T>.Has(var property, var value)
					=> Expression.Call(
						typeof(Enumerable),
						"Contains",
						new[] { value.GetType() },
						Expression.Property(x, property),
						Expression.Constant(value)
					),
				Filter<T>.CmpRandom(var op, var seed, var refId)
					=> CmpRandomHandler(op, seed, refId),
				Filter<T>.Lambda(var lambda)
					=> ExpressionArgumentReplacer.ReplaceParams(lambda.Body, lambda.Parameters, x),
				_ => throw new NotImplementedException(),
			};
		}

		Expression body = Parse(filter);
		return Expression.Lambda<Func<T, bool>>(body, x);
	}
}
