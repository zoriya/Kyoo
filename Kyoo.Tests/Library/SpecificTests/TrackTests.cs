using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Library
{
	namespace SqLite
	{
		public class TrackTests : ATrackTests
		{
			public TrackTests(ITestOutputHelper output)
				: base(new RepositoryActivator(output)) { }
		}
	}


	namespace PostgreSQL
	{
		[Collection(nameof(Postgresql))]
		public class TrackTests : ATrackTests
		{
			public TrackTests(PostgresFixture postgres, ITestOutputHelper output)
				: base(new RepositoryActivator(output, postgres)) { }
		}
	}

	public abstract class ATrackTests : RepositoryTests<Track>
	{
		private readonly ITrackRepository _repository;

		protected ATrackTests(RepositoryActivator repositories)
			: base(repositories)
		{
			_repository = repositories.LibraryManager.TrackRepository;
		}
		
		[Fact]
		public async Task SlugEditTest()
		{
			await Repositories.LibraryManager.ShowRepository.Edit(new Show
			{
				ID = 1,
				Slug = "new-slug"
			}, false);
			Track track = await _repository.Get(1);
			Assert.Equal("new-slug-s1e1.eng-1.subtitle", track.Slug);
		}
		
		[Fact]
		public async Task UndefinedLanguageSlugTest()
		{
			await _repository.Create(new Track
			{
				ID = 5,
				TrackIndex = 0,
				Type = StreamType.Video,
				Language = null,
				EpisodeID = TestSample.Get<Episode>().ID
			});
			Track track = await _repository.Get(5);
			Assert.Equal("anohana-s1e1.und.video", track.Slug);
		}
	}
}