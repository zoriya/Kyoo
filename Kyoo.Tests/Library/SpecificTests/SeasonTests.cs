using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Xunit;
using Xunit.Extensions.Ordering;

namespace Kyoo.Tests.SpecificTests
{
	public class SqLiteSeasonTests : SeasonTests
	{
		public SqLiteSeasonTests()
			: base(new RepositoryActivator())
		{ }
	}


	public class PostgresSeasonTests : SeasonTests, IAssemblyFixture<PostgresFixture>
	{
		public PostgresSeasonTests(PostgresFixture postgres)
			: base(new RepositoryActivator(postgres))
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
		
		[Fact]
		public async Task SeasonCreationSlugTest()
		{
			Season season = await _repository.Create(new Season
			{
				ShowID = TestSample.Get<Show>().ID,
				SeasonNumber = 2
			});
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s2", season.Slug);
		}
	}
}