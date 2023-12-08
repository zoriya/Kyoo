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
using System.Linq.Expressions;
using System.Reflection;
using Kyoo.Abstractions.Models;
using Xunit;
using KUtility = Kyoo.Utils.Utility;

namespace Kyoo.Tests.Utility
{
	public class UtilityTests
	{
		[Fact]
		public void IsPropertyExpression_Tests()
		{
			Expression<Func<Show, Guid>> member = x => x.Id;
			Expression<Func<Show, object>> memberCast = x => x.Id;

			Assert.True(KUtility.IsPropertyExpression(member));
			Assert.True(KUtility.IsPropertyExpression(memberCast));

			Expression<Func<Show, object>> call = x => x.ToString();
			Assert.False(KUtility.IsPropertyExpression(call));
		}

		[Fact]
		public void GetPropertyName_Test()
		{
			Expression<Func<Show, Guid>> member = x => x.Id;
			Expression<Func<Show, object>> memberCast = x => x.Id;

			Assert.Equal("Id", KUtility.GetPropertyName(member));
			Assert.Equal("Id", KUtility.GetPropertyName(memberCast));
		}

		[Fact]
		public void GetMethodTest()
		{
			MethodInfo method = KUtility.GetMethod(
				typeof(UtilityTests),
				BindingFlags.Instance | BindingFlags.Public,
				nameof(GetMethodTest),
				Array.Empty<Type>(),
				Array.Empty<object>()
			);
			Assert.Equal(MethodBase.GetCurrentMethod(), method);
		}

		[Fact]
		public void GetMethodInvalidGenericsTest()
		{
			Assert.Throws<ArgumentException>(
				() =>
					KUtility.GetMethod(
						typeof(UtilityTests),
						BindingFlags.Instance | BindingFlags.Public,
						nameof(GetMethodTest),
						new[] { typeof(KUtility) },
						Array.Empty<object>()
					)
			);
		}

		[Fact]
		public void GetMethodInvalidParamsTest()
		{
			Assert.Throws<ArgumentException>(
				() =>
					KUtility.GetMethod(
						typeof(UtilityTests),
						BindingFlags.Instance | BindingFlags.Public,
						nameof(GetMethodTest),
						Array.Empty<Type>(),
						new object[] { this }
					)
			);
		}
	}
}
