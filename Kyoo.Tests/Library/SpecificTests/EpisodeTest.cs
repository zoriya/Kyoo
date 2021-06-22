using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Xunit;

namespace Kyoo.Tests.Library
{
	namespace SqLite
	{
		public class EpisodeTests : AEpisodeTests
		{
			public EpisodeTests()
				: base(new RepositoryActivator()) { }
		}
	}


	namespace PostgreSQL
	{
		[Collection(nameof(Postgresql))]
		public class EpisodeTests : AEpisodeTests
		{
			public EpisodeTests(PostgresFixture postgres)
				: base(new RepositoryActivator(postgres)) { }
		}
	}

	public abstract class AEpisodeTests : RepositoryTests<Episode>
	{
		private readonly IEpisodeRepository _repository;

		protected AEpisodeTests(RepositoryActivator repositories)
			: base(repositories)
		{
			_repository = repositories.LibraryManager.EpisodeRepository;
		}
		
		[Fact]
		public async Task SlugEditTest()
		{
			Episode episode = await _repository.Get(1);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e1", episode.Slug);
			Show show = new()
			{
				ID = episode.ShowID,
				Slug = "new-slug"
			};
			await Repositories.LibraryManager.ShowRepository.Edit(show, false);
			episode = await _repository.Get(1);
			Assert.Equal("new-slug-s1e1", episode.Slug);
		}
		
		[Fact]
		public async Task SeasonNumberEditTest()
		{
			Episode episode = await _repository.Get(1);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e1", episode.Slug);
			await _repository.Edit(new Episode
			{
				ID = 1,
				SeasonNumber = 2
			}, false);
			episode = await _repository.Get(1);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s2e1", episode.Slug);
		}
		
		[Fact]
		public async Task EpisodeNumberEditTest()
		{
			Episode episode = await _repository.Get(1);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e1", episode.Slug);
			await _repository.Edit(new Episode
			{
				ID = 1,
				EpisodeNumber = 2
			}, false);
			episode = await _repository.Get(1);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e2", episode.Slug);
		}
		
		[Fact]
		public async Task EpisodeCreationSlugTest()
		{
			Episode season = await _repository.Create(new Episode
			{
				ShowID = TestSample.Get<Show>().ID,
				SeasonNumber = 2,
				EpisodeNumber = 4
			});
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s2e4", season.Slug);
		}
		
		
		// TODO absolute numbering tests
	}
}