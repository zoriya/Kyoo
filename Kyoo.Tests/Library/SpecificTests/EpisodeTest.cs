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
			episode = await _repository.Edit(new Episode
			{
				ID = 1,
				SeasonNumber = 2
			}, false);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s2e2", episode.Slug);
			episode = await _repository.Get(1);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s2e1", episode.Slug);
		}
		
		[Fact]
		public async Task EpisodeNumberEditTest()
		{
			Episode episode = await _repository.Get(1);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e1", episode.Slug);
			episode = await _repository.Edit(new Episode
			{
				ID = 1,
				EpisodeNumber = 2
			}, false);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e2", episode.Slug);
			episode = await _repository.Get(1);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e2", episode.Slug);
		}
		
		[Fact]
		public async Task EpisodeCreationSlugTest()
		{
			Episode episode = await _repository.Create(new Episode
			{
				ShowID = TestSample.Get<Show>().ID,
				SeasonNumber = 2,
				EpisodeNumber = 4
			});
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s2e4", episode.Slug);
		}
		
		
		// TODO absolute numbering tests


		[Fact]
		public void AbsoluteSlugTest()
		{
			Assert.Equal($"{TestSample.Get<Show>().Slug}-{TestSample.GetAbsoluteEpisode().AbsoluteNumber}", 
				TestSample.GetAbsoluteEpisode().Slug);
		}
		
		[Fact]
		public async Task EpisodeCreationAbsoluteSlugTest()
		{
			Episode episode = await _repository.Create(TestSample.GetAbsoluteEpisode());
			Assert.Equal($"{TestSample.Get<Show>().Slug}-{TestSample.GetAbsoluteEpisode().AbsoluteNumber}", episode.Slug);
		}
		
		[Fact]
		public async Task SlugEditAbsoluteTest()
		{
			Episode episode = await _repository.Create(TestSample.GetAbsoluteEpisode());
			Show show = new()
			{
				ID = episode.ShowID,
				Slug = "new-slug"
			};
			await Repositories.LibraryManager.ShowRepository.Edit(show, false);
			episode = await _repository.Get(2);
			Assert.Equal($"new-slug-3", episode.Slug);
		}
		
		
		[Fact]
		public async Task AbsoluteNumberEditTest()
		{
			await _repository.Create(TestSample.GetAbsoluteEpisode());
			Episode episode = await _repository.Edit(new Episode
			{
				ID = 2,
				AbsoluteNumber = 56
			}, false);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-56", episode.Slug);
			episode = await _repository.Get(2);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-56", episode.Slug);
		}
		
		[Fact]
		public async Task AbsoluteToNormalEditTest()
		{
			await _repository.Create(TestSample.GetAbsoluteEpisode());
			Episode episode = await _repository.Edit(new Episode
			{
				ID = 2,
				SeasonNumber = 1,
				EpisodeNumber = 2
			}, false);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e2", episode.Slug);
			episode = await _repository.Get(2);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e2", episode.Slug);
		}
		
		[Fact]
		public async Task NormalToAbsoluteEditTest()
		{
			Episode episode = await _repository.Edit(new Episode
			{
				ID = 1,
				SeasonNumber = null,
				AbsoluteNumber = 12
			}, false);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-12", episode.Slug);
			episode = await _repository.Get(1);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-12", episode.Slug);
		}
	}
}