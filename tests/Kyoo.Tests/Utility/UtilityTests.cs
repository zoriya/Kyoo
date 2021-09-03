using System;
using System.Linq.Expressions;
using System.Reflection;
using Kyoo.Abstractions.Models;
using Kyoo.Utils;
using Xunit;

using KUtility = Kyoo.Utils.Utility;

namespace Kyoo.Tests.Utility
{
	public class UtilityTests
	{
		[Fact]
		public void IsPropertyExpression_Tests()
		{
			Expression<Func<Show, int>> member = x => x.ID;
			Expression<Func<Show, object>> memberCast = x => x.ID;

			Assert.False(KUtility.IsPropertyExpression(null));
			Assert.True(KUtility.IsPropertyExpression(member));
			Assert.True(KUtility.IsPropertyExpression(memberCast));

			Expression<Func<Show, object>> call = x => x.GetID("test");
			Assert.False(KUtility.IsPropertyExpression(call));
		}

		[Fact]
		public void GetPropertyName_Test()
		{
			Expression<Func<Show, int>> member = x => x.ID;
			Expression<Func<Show, object>> memberCast = x => x.ID;

			Assert.Equal("ID", KUtility.GetPropertyName(member));
			Assert.Equal("ID", KUtility.GetPropertyName(memberCast));
			Assert.Throws<ArgumentException>(() => KUtility.GetPropertyName(null));
		}

		[Fact]
		public void GetMethodTest()
		{
			MethodInfo method = KUtility.GetMethod(typeof(UtilityTests),
				BindingFlags.Instance | BindingFlags.Public,
				nameof(GetMethodTest),
				Array.Empty<Type>(),
				Array.Empty<object>());
			Assert.Equal(MethodBase.GetCurrentMethod(), method);
		}

		[Fact]
		public void GetMethodInvalidGenericsTest()
		{
			Assert.Throws<ArgumentException>(() => KUtility.GetMethod(typeof(UtilityTests),
				BindingFlags.Instance | BindingFlags.Public,
				nameof(GetMethodTest),
				new[] { typeof(KUtility) },
				Array.Empty<object>()));
		}

		[Fact]
		public void GetMethodInvalidParamsTest()
		{
			Assert.Throws<ArgumentException>(() => KUtility.GetMethod(typeof(UtilityTests),
				BindingFlags.Instance | BindingFlags.Public,
				nameof(GetMethodTest),
				Array.Empty<Type>(),
				new object[] { this }));
		}

		[Fact]
		public void GetMethodTest2()
		{
			MethodInfo method = KUtility.GetMethod(typeof(Merger),
				BindingFlags.Static | BindingFlags.Public,
				nameof(Merger.MergeLists),
				new[] { typeof(string) },
				new object[] { "string", "string2", null });
			Assert.Equal(nameof(Merger.MergeLists), method.Name);
		}
	}
}