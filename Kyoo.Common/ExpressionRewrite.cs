using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

namespace Kyoo
{
	public class ExpressionRewriteAttribute : Attribute
	{
		public string Link { get; }
		public string Inner { get; }

		public ExpressionRewriteAttribute(string link, string inner = null)
		{
			Link = link;
			Inner = inner;
		}
	}

	public class ExpressionRewrite : ExpressionVisitor
	{
		private string _inner;
		private readonly List<(string inner, ParameterExpression param, ParameterExpression newParam)> _innerRewrites;

		private ExpressionRewrite()
		{
			_innerRewrites = new List<(string, ParameterExpression, ParameterExpression)>();
		}
		
		public static Expression Rewrite(Expression expression)
		{
			return new ExpressionRewrite().Visit(expression);
		}
		
		public static Expression<T> Rewrite<T>(Expression expression) where T : Delegate
		{
			return (Expression<T>)new ExpressionRewrite().Visit(expression);
		}

		protected override Expression VisitMember(MemberExpression node)
		{
			(string inner, _, ParameterExpression p) = _innerRewrites.FirstOrDefault(x => x.param == node.Expression);
			if (inner != null)
			{
				Expression param = p;
				foreach (string accessor in inner.Split('.'))
					param = Expression.Property(param, accessor);
				node = Expression.Property(param, node.Member.Name);
			}
			
			// Can't use node.Member directly because we want to support attribute override
			MemberInfo member = node.Expression.Type.GetProperty(node.Member.Name) ?? node.Member;
			ExpressionRewriteAttribute attr = member!.GetCustomAttribute<ExpressionRewriteAttribute>();
			if (attr == null)
				return base.VisitMember(node);

			Expression property = node.Expression;
			foreach (string child in attr.Link.Split('.'))
				property = Expression.Property(property, child);
			
			if (property is MemberExpression expr)
				Visit(expr.Expression);
			_inner = attr.Inner;
			return property;
		}

		protected override Expression VisitLambda<T>(Expression<T> node)
		{
			(_, ParameterExpression oldParam, ParameterExpression param) = _innerRewrites
				.FirstOrDefault(x => node.Parameters.Any(y => y == x.param));
			if (param == null)
				return base.VisitLambda(node);
			
			ParameterExpression[] newParams = node.Parameters.Where(x => x != oldParam).Append(param).ToArray();
			return Expression.Lambda(Visit(node.Body)!, newParams);
		}

		protected override Expression VisitMethodCall(MethodCallExpression node)
		{
			int count = node.Arguments.Count;
			if (node.Object != null)
				count++;
			if (count != 2)
				return base.VisitMethodCall(node);
			
			Expression instance = node.Object ?? node.Arguments.First();
			Expression argument = node.Object != null
				? node.Arguments.First()
				: node.Arguments[1];
			
			Type oldType = instance.Type;
			instance = Visit(instance);
			if (instance!.Type == oldType)
				return base.VisitMethodCall(node);

			if (_inner != null && argument is LambdaExpression lambda)
			{
				// TODO this type handler will usually work with IEnumerable & others but won't work with everything.
				Type type = oldType.GetGenericArguments().First();
				ParameterExpression oldParam = lambda.Parameters.FirstOrDefault(x => x.Type == type);
				if (oldParam != null) 
				{
					Type newType = instance.Type.GetGenericArguments().First();
					ParameterExpression newParam = Expression.Parameter(newType, oldParam.Name);
					_innerRewrites.Add((_inner, oldParam, newParam));
				}
			}
			argument = Visit(argument);
			
			// TODO this method handler may not work for some methods (ex: method taking a Fun<> method won't have good generic arguments)
			MethodInfo method = node.Method.IsGenericMethod
				? node.Method.GetGenericMethodDefinition().MakeGenericMethod(instance.Type.GetGenericArguments())
				: node.Method;
			return node.Object != null
				? Expression.Call(instance, method!, argument) 
				: Expression.Call(null, method!, instance, argument!);
		}
	}
}