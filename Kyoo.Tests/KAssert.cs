using System.Reflection;
using Xunit;

namespace Kyoo.Tests
{
	public static class KAssert
	{
		public static void DeepEqual<T>(T expected, T value)
		{
			foreach (PropertyInfo property in typeof(T).GetProperties())
				Assert.Equal(property.GetValue(expected), property.GetValue(value));
		}
	}
}