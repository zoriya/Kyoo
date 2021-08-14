using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Database;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Database
{
	namespace SqLite
	{
		public class EpisodeTests : AEpisodeTests
		{
			public EpisodeTests(ITestOutputHelper output)
				: base(new RepositoryActivator(output)) { }
		}
	}


	namespace PostgreSQL
	{
		[Collection(nameof(Postgresql))]
		public class EpisodeTests : AEpisodeTests
		{
			public EpisodeTests(PostgresFixture postgres, ITestOutputHelper output)
				: base(new RepositoryActivator(output, postgres)) { }
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
				SeasonNumber = 2,
				ShowID = 1
			}, false);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s2e1", episode.Slug);
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
				EpisodeNumber = 2,
				ShowID = 1
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
				AbsoluteNumber = 56,
				ShowID = 1
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
				EpisodeNumber = 2,
				ShowID = 1
			}, false);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e2", episode.Slug);
			episode = await _repository.Get(2);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e2", episode.Slug);
		}
		
		[Fact]
		public async Task NormalToAbsoluteEditTest()
		{
			Episode episode = await _repository.Get(1);
			episode.SeasonNumber = null;
			episode.AbsoluteNumber = 12;
			episode = await _repository.Edit(episode, true);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-12", episode.Slug);
			episode = await _repository.Get(1);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-12", episode.Slug);
		}
		
		[Fact]
		public async Task MovieEpisodeTest()
		{
			Episode episode = await _repository.Create(TestSample.GetMovieEpisode());
			Assert.Equal(TestSample.Get<Show>().Slug, episode.Slug);
			episode = await _repository.Get(3);
			Assert.Equal(TestSample.Get<Show>().Slug, episode.Slug);
		}
		
		[Fact]
		public async Task MovieEpisodeEditTest()
		{
			await _repository.Create(TestSample.GetMovieEpisode());
			await Repositories.LibraryManager.Edit(new Show
			{
				ID = 1,
				Slug = "john-wick"
			}, false);
			Episode episode = await _repository.Get(3);
			Assert.Equal("john-wick", episode.Slug);
		}
		
		[Fact]
		public async Task CreateWithExternalIdTest()
		{
			Episode value = TestSample.GetNew<Episode>();
			value.ExternalIDs = new[]
			{
				new MetadataID
				{
					Provider = TestSample.Get<Provider>(),
					Link = "link",
					DataID = "id"
				},
				new MetadataID
				{
					Provider = TestSample.GetNew<Provider>(),
					Link = "new-provider-link",
					DataID = "new-id"
				}
			};
			await _repository.Create(value);
			
			Episode retrieved = await _repository.Get(2);
			await Repositories.LibraryManager.Load(retrieved, x => x.ExternalIDs);
			Assert.Equal(2, retrieved.ExternalIDs.Count);
			KAssert.DeepEqual(value.ExternalIDs.First(), retrieved.ExternalIDs.First());
			KAssert.DeepEqual(value.ExternalIDs.Last(), retrieved.ExternalIDs.Last());
		}
		
		[Fact]
		public async Task EditTest()
		{
			Episode value = await _repository.Get(TestSample.Get<Episode>().Slug);
			value.Title = "New Title";
			value.Images = new Dictionary<int, string>
			{
				[Images.Poster] = "new-poster"
			};
			await _repository.Edit(value, false);
		
			await using DatabaseContext database = Repositories.Context.New();
			Episode retrieved = await database.Episodes.FirstAsync();
			
			KAssert.DeepEqual(value, retrieved);
		}
		
		[Fact]
		public async Task EditMetadataTest()
		{
			Episode value = await _repository.Get(TestSample.Get<Episode>().Slug);
			value.ExternalIDs = new[]
			{
				new MetadataID
				{
					Provider = TestSample.Get<Provider>(),
					Link = "link",
					DataID = "id"
				},
			};
			await _repository.Edit(value, false);
		
			await using DatabaseContext database = Repositories.Context.New();
			Episode retrieved = await database.Episodes
				.Include(x => x.ExternalIDs)
				.ThenInclude(x => x.Provider)
				.FirstAsync();
			
			KAssert.DeepEqual(value, retrieved);
		}

		[Fact]
		public async Task AddMetadataTest()
		{
			Episode value = await _repository.Get(TestSample.Get<Episode>().Slug);
			value.ExternalIDs = new List<MetadataID>
			{
				new()
				{
					Provider = TestSample.Get<Provider>(),
					Link = "link",
					DataID = "id"
				},
			};
			await _repository.Edit(value, false);

			{
				await using DatabaseContext database = Repositories.Context.New();
				Episode retrieved = await database.Episodes
					.Include(x => x.ExternalIDs)
					.ThenInclude(x => x.Provider)
					.FirstAsync();

				KAssert.DeepEqual(value, retrieved);
			}

			value.ExternalIDs.Add(new MetadataID
			{
				Provider = TestSample.GetNew<Provider>(),
				Link = "link",
				DataID = "id"
			});
			await _repository.Edit(value, false);
			
			{
				await using DatabaseContext database = Repositories.Context.New();
				Episode retrieved = await database.Episodes
					.Include(x => x.ExternalIDs)
					.ThenInclude(x => x.Provider)
					.FirstAsync();

				KAssert.DeepEqual(value, retrieved);
			}
		}
		
		[Theory]
		[InlineData("test")]
		[InlineData("super")]
		[InlineData("title")]
		[InlineData("TiTlE")]
		[InlineData("SuPeR")]
		public async Task SearchTest(string query)
		{
			Episode value = new()
			{
				Title = "This is a test super title",
				ShowID = 1,
				AbsoluteNumber = 2
			};
			await _repository.Create(value);
			ICollection<Episode> ret = await _repository.Search(query);
			KAssert.DeepEqual(value, ret.First());
		}
	}
}