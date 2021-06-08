using Kyoo.Models;
using Xunit;

namespace Kyoo.Tests
{
	public class MergerTests
	{
		[Fact]
		public void NullifyTest()
		{
			Genre genre = new("test")
			{
				ID = 5
			};
			Merger.Nullify(genre);
			Assert.Equal(0, genre.ID);
			Assert.Null(genre.Name);
			Assert.Null(genre.Slug);
		}
	}
}