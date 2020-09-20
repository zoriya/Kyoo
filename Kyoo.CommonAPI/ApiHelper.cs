using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using Kyoo.Models;

namespace Kyoo.CommonApi
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
			{
				if (defaultWhere == null)
					return null;
				Expression body = ExpressionRewrite.Rewrite(defaultWhere.Body);
				return Expression.Lambda<Func<T, bool>>(body, defaultWhere.Parameters.First());
			}

			ParameterExpression param = defaultWhere?.Parameters.First() ?? Expression.Parameter(typeof(T));
			Expression expression = defaultWhere?.Body;

			foreach ((string key, string desired) in where)
			{
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
				if (operand != "ctn" && !typeof(IResource).IsAssignableFrom(propertyExpr.Type))
				{
					Type propertyType = Nullable.GetUnderlyingType(property.PropertyType) ?? property.PropertyType;
					object val = string.IsNullOrEmpty(value) || value.Equals("null", StringComparison.OrdinalIgnoreCase)
							? null
							: Convert.ChangeType(value, propertyType);
					valueExpr = Expression.Constant(val, property.PropertyType);
				}

				Expression condition = operand switch
				{
					"eq" when valueExpr == null => ResourceEqual(propertyExpr, value),
					"not" when valueExpr == null => ResourceEqual(propertyExpr, value, true),
					"eq" => Expression.Equal(propertyExpr, valueExpr),
					"not" => Expression.NotEqual(propertyExpr, valueExpr!),
					"lt" => StringCompatibleExpression(Expression.LessThan, propertyExpr, valueExpr),
					"lte" => StringCompatibleExpression(Expression.LessThanOrEqual, propertyExpr, valueExpr),
					"gt" => StringCompatibleExpression(Expression.GreaterThan, propertyExpr, valueExpr),
					"gte" => StringCompatibleExpression(Expression.GreaterThanOrEqual, propertyExpr, valueExpr),
					"ctn" => ContainsResourceExpression(propertyExpr, value),
					_ => throw new ArgumentException($"Invalid operand: {operand}")	
				};

				if (expression != null)
					expression = Expression.AndAlso(expression, condition);
				else
					expression = condition;
			}

			expression = ExpressionRewrite.Rewrite(expression);
			return Expression.Lambda<Func<T, bool>>(expression, param);
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

			if (notEqual)
				return Expression.NotEqual(field, valueConst);
			return Expression.Equal(field, valueConst);
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