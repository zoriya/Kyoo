using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

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
		
		public static Expression<Func<T, bool>> ParseWhere<T>(Dictionary<string, string> where)
		{
			if (where == null || where.Count == 0)
				return null;
			
			ParameterExpression param = Expression.Parameter(typeof(T));
			Expression expression = null;

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
				
				Type propertyType = Nullable.GetUnderlyingType(property.PropertyType) ?? property.PropertyType;
				object val = string.IsNullOrEmpty(value) || value.Equals("null", StringComparison.OrdinalIgnoreCase)
					? null 
					: Convert.ChangeType(value, propertyType);
				ConstantExpression valueExpr = Expression.Constant(val, property.PropertyType);

				Expression condition = operand switch
				{
					"eq" => Expression.Equal(propertyExpr, valueExpr),
					"not" => Expression.NotEqual(propertyExpr, valueExpr),
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
	}
}