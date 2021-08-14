using System;
using System.Linq.Expressions;
using System.Reflection;
using Kyoo.Abstractions.Models;
using Xunit;

using Utils = Kyoo.Utility;

namespace Kyoo.Tests.Utility
{
	public class UtilityTests
	{
		[Fact]
		public void IsPropertyExpression_Tests()
		{
			Expression<Func<Show, int>> member = x => x.ID;
			Expression<Func<Show, object>> memberCast = x => x.ID;

			Assert.False(Utils.IsPropertyExpression(null));
			Assert.True(Utils.IsPropertyExpression(member));
			Assert.True(Utils.IsPropertyExpression(memberCast));

			Expression<Func<Show, object>> call = x => x.GetID("test");
			Assert.False(Utils.IsPropertyExpression(call));
		}
		
		[Fact]
		public void GetPropertyName_Test()
		{
			Expression<Func<Show, int>> member = x => x.ID;
			Expression<Func<Show, object>> memberCast = x => x.ID;

			Assert.Equal("ID", Utils.GetPropertyName(member));
			Assert.Equal("ID", Utils.GetPropertyName(memberCast));
			Assert.Throws<ArgumentException>(() => Utils.GetPropertyName(null));
		}
		
		[Fact]
		public void GetMethodTest()
		{
			MethodInfo method = Utils.GetMethod(typeof(UtilityTests),
				BindingFlags.Instance | BindingFlags.Public, 
				nameof(GetMethodTest),
				Array.Empty<Type>(),
				Array.Empty<object>());
			Assert.Equal(MethodBase.GetCurrentMethod(), method);
		}
		
		[Fact]
		public void GetMethodInvalidGenericsTest()
		{
			Assert.Throws<ArgumentException>(() => Utils.GetMethod(typeof(UtilityTests),
				BindingFlags.Instance | BindingFlags.Public, 
				nameof(GetMethodTest),
				new [] { typeof(Utils) },
				Array.Empty<object>()));
		}
		
		[Fact]
		public void GetMethodInvalidParamsTest()
		{
			Assert.Throws<ArgumentException>(() => Utils.GetMethod(typeof(UtilityTests),
				BindingFlags.Instance | BindingFlags.Public, 
				nameof(GetMethodTest),
				Array.Empty<Type>(),
				new object[] { this }));
		}
		
		[Fact]
		public void GetMethodTest2()
		{
			MethodInfo method = Utils.GetMethod(typeof(Merger),
				BindingFlags.Static | BindingFlags.Public, 
				nameof(Merger.MergeLists),
				new [] { typeof(string) },
				new object[] { "string", "string2", null });
			Assert.Equal(nameof(Merger.MergeLists), method.Name);
		}
	}
}