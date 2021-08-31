using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using Kyoo.Abstractions.Models;

namespace Kyoo.Core.Api
{
	public static class ApiHelper
	{
		public static Expression StringCompatibleExpression(Func<Expression, Expression, BinaryExpression> operand,
			Expression left,
			Expression right)
		{
			if (left is MemberExpression member && ((PropertyInfo)member.Member).PropertyType == typeof(string))
			{
				MethodCallExpression call = Expression.Call(typeof(string), "Compare", null, left, right);
				return operand(call, Expression.Constant(0));
			}
			return operand(left, right);
		}
		
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
				bool isList = typeof(IEnumerable).IsAssignableFrom(propertyExpr.Type);
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
					"eq" when isList => ContainsResourceExpression(propertyExpr, value),
					"ctn" => ContainsResourceExpression(propertyExpr, value),
					
					"eq" when valueExpr == null => ResourceEqual(propertyExpr, value),
					"not" when valueExpr == null => ResourceEqual(propertyExpr, value, true),
					
					"eq" => Expression.Equal(propertyExpr, valueExpr),
					"not" => Expression.NotEqual(propertyExpr, valueExpr!),
					"lt" => StringCompatibleExpression(Expression.LessThan, propertyExpr, valueExpr),
					"lte" => StringCompatibleExpression(Expression.LessThanOrEqual, propertyExpr, valueExpr),
					"gt" => StringCompatibleExpression(Expression.GreaterThan, propertyExpr, valueExpr),
					"gte" => StringCompatibleExpression(Expression.GreaterThanOrEqual, propertyExpr, valueExpr),
					_ => throw new ArgumentException($"Invalid operand: {operand}")
				};

				if (expression != null)
					expression = Expression.AndAlso(expression, condition);
				else
					expression = condition;
			}

			return Expression.Lambda<Func<T, bool>>(expression!, param);
		}

		private static Expression ResourceEqual(Expression parameter, string value, bool notEqual = false)
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
		
		private static Expression ContainsResourceExpression(MemberExpression xProperty, string value)
		{
			// x => x.PROPERTY.Any(y => y.Slug == value)
			Expression ret = null;
			ParameterExpression y = Expression.Parameter(xProperty.Type.GenericTypeArguments.First(), "y");
			foreach (string val in value.Split(','))
			{
				LambdaExpression lambda = Expression.Lambda(ResourceEqual(y, val), y);
				Expression iteration = Expression.Call(typeof(Enumerable), "Any", xProperty.Type.GenericTypeArguments,
					xProperty, lambda);

				if (ret == null)
					ret = iteration;
				else
					ret = Expression.AndAlso(ret, iteration);
			}
			return ret;
		}
	}
}