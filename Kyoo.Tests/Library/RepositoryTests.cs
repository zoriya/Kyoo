using System.Linq;
using Xunit;

namespace Kyoo.Tests
{
	public class RepositoryTests
	{
		[Fact]
		public void Get_Test()
		{
			TestContext context = new();
			using DatabaseContext database = context.New();
			
			Assert.Equal(1, database.Shows.Count());
		}
	}
}