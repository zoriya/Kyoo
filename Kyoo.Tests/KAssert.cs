using System.Linq;
using System.Reflection;
using JetBrains.Annotations;
using Xunit;
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
			foreach (PropertyInfo property in typeof(T).GetProperties(BindingFlags.Instance))
				Assert.Equal(property.GetValue(expected), property.GetValue(value));
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