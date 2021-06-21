using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Xunit;

namespace Kyoo.Tests.Library
{
	namespace SqLite
	{
		public class SeasonTests : ASeasonTests
		{
			public SeasonTests()
				: base(new RepositoryActivator()) { }
		}
	}


	namespace PostgreSQL
	{
		[Collection(nameof(Postgresql))]
		public class SeasonTests : ASeasonTests
		{
			public SeasonTests(PostgresFixture postgres)
				: base(new RepositoryActivator(postgres)) { }
		}
	}

	public abstract class ASeasonTests : RepositoryTests<Season>
	{
		private readonly ISeasonRepository _repository;

		protected ASeasonTests(RepositoryActivator repositories)
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