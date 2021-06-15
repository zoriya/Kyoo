using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Xunit;

namespace Kyoo.Tests.SpecificTests
{
	public class SqLiteSeasonTests : SeasonTests
	{
		public SqLiteSeasonTests()
			: base(new RepositoryActivator(true))
		{ }
	}
	
	public abstract class SeasonTests : RepositoryTests<Season>
	{
		private readonly ISeasonRepository _repository;

		protected SeasonTests(RepositoryActivator repositories)
			: base(repositories)
		{
			_repository = Repositories.LibraryManager.SeasonRepository;
		}

		[Fact]
		public async Task SlugEditTest()
		{
			Season season = await _repository.Get(1);
			Assert.Equal("anohana-s1", season.Slug);
			Show show = new()
			{
				ID = season.ShowID,
				Slug = "new-slug"
			};
			await Repositories.LibraryManager.ShowRepository.Edit(show, false);
			season = await _repository.Get(1);
			Assert.Equal("new-slug-s1", season.Slug);
		}
		
		[Fact]
		public async Task SeasonNumberEditTest()
		{
			Season season = await _repository.Get(1);
			Assert.Equal("anohana-s1", season.Slug);
			await _repository.Edit(new Season
			{
				ID = 1,
				SeasonNumber = 2
			}, false);
			season = await _repository.Get(1);
			Assert.Equal("anohana-s2", season.Slug);
		}
	}
}