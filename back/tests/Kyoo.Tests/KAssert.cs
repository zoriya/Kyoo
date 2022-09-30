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

using FluentAssertions;
using JetBrains.Annotations;
using Xunit.Sdk;

namespace Kyoo.Tests
{
	/// <summary>
	/// Custom assertions used by Kyoo's tests.
	/// </summary>
	public static class KAssert
	{
		/// <summary>
		/// Check if every property of the item is equal to the other's object.
		/// </summary>
		/// <param name="expected">The value to check against</param>
		/// <param name="value">The value to check</param>
		/// <typeparam name="T">The type to check</typeparam>
		[AssertionMethod]
		public static void DeepEqual<T>(T expected, T value)
		{
			value.Should().BeEquivalentTo(expected);
		}

		/// <summary>
		/// Explicitly fail a test.
		/// </summary>
		[AssertionMethod]
		public static void Fail()
		{
			throw new XunitException();
		}

		/// <summary>
		/// Explicitly fail a test.
		/// </summary>
		/// <param name="message">The message that will be seen in the test report</param>
		[AssertionMethod]
		public static void Fail(string message)
		{
			throw new XunitException(message);
		}
	}
}
