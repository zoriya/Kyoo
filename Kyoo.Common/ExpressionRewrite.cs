using System;
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
			ExpressionRewriteAttribute attr = node.Member.GetCustomAttribute<ExpressionRewriteAttribute>();
			if (attr == null)
				return base.VisitMember(node);
			
			Expression property = node.Expression;
			foreach (string child in attr.Link.Split('.'))
				property = Expression.Property(property, child);
			
			if (property is MemberExpression member)
				Visit(member.Expression);
			return property;
		}
	}
}