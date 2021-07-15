using System;
using System.Linq.Expressions;
using System.Reflection;
using Kyoo.Models;
using Xunit;

namespace Kyoo.Tests
{
	public class UtilityTests
	{
		[Fact]
		public void IsPropertyExpression_Tests()
		{
			Expression<Func<Show, int>> member = x => x.ID;
			Expression<Func<Show, object>> memberCast = x => x.ID;

			Assert.False(Utility.IsPropertyExpression(null));
			Assert.True(Utility.IsPropertyExpression(member));
			Assert.True(Utility.IsPropertyExpression(memberCast));

			Expression<Func<Show, object>> call = x => x.GetID("test");
			Assert.False(Utility.IsPropertyExpression(call));
		}
		
		[Fact]
		public void GetPropertyName_Test()
		{
			Expression<Func<Show, int>> member = x => x.ID;
			Expression<Func<Show, object>> memberCast = x => x.ID;

			Assert.Equal("ID", Utility.GetPropertyName(member));
			Assert.Equal("ID", Utility.GetPropertyName(memberCast));
			Assert.Throws<ArgumentException>(() => Utility.GetPropertyName(null));
		}
		
		[Fact]
		public void GetMethodTest()
		{
			MethodInfo method = Utility.GetMethod(typeof(UtilityTests),
				BindingFlags.Instance | BindingFlags.Public, 
				nameof(GetMethodTest),
				Array.Empty<Type>(),
				Array.Empty<object>());
			Assert.Equal(MethodBase.GetCurrentMethod(), method);
		}
		
		[Fact]
		public void GetMethodInvalidGenericsTest()
		{
			Assert.Throws<ArgumentException>(() => Utility.GetMethod(typeof(UtilityTests),
				BindingFlags.Instance | BindingFlags.Public, 
				nameof(GetMethodTest),
				new [] { typeof(Utility) },
				Array.Empty<object>()));
		}
		
		[Fact]
		public void GetMethodInvalidParamsTest()
		{
			Assert.Throws<ArgumentException>(() => Utility.GetMethod(typeof(UtilityTests),
				BindingFlags.Instance | BindingFlags.Public, 
				nameof(GetMethodTest),
				Array.Empty<Type>(),
				new object[] { this }));
		}
		
		[Fact]
		public void GetMethodTest2()
		{
			MethodInfo method = Utility.GetMethod(typeof(Merger),
				BindingFlags.Static | BindingFlags.Public, 
				nameof(Merger.MergeLists),
				new [] { typeof(string) },
				new object[] { "string", "string2", null });
			Assert.Equal(nameof(Merger.MergeLists), method.Name);
		}
	}
}