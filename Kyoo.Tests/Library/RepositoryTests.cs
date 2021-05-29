using System;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Xunit;

namespace Kyoo.Tests
{
	public class RepositoryActivator : IDisposable, IAsyncDisposable
	{
		public TestContext Context { get; init; }
		public ILibraryManager LibraryManager { get; init; }


		private readonly DatabaseContext _database; 
			
		public RepositoryActivator()
		{
			Context = new TestContext();
			_database = Context.New();
			
			ProviderRepository provider = new(_database);
			LibraryRepository library = new(_database, provider);
			CollectionRepository collection = new(_database);
			GenreRepository genre = new(_database);
			StudioRepository studio = new(_database);
			PeopleRepository people = new(_database, provider, 
				new Lazy<IShowRepository>(() => LibraryManager.ShowRepository));
			ShowRepository show = new(_database, studio, people, genre, provider, 
				new Lazy<ISeasonRepository>(() => LibraryManager.SeasonRepository),
				new Lazy<IEpisodeRepository>(() => LibraryManager.EpisodeRepository));
			SeasonRepository season = new(_database, provider, show, 
				new Lazy<IEpisodeRepository>(() => LibraryManager.EpisodeRepository));
			LibraryItemRepository libraryItem = new(_database, 
				new Lazy<ILibraryRepository>(() => LibraryManager.LibraryRepository),
				new Lazy<IShowRepository>(() => LibraryManager.ShowRepository),
				new Lazy<ICollectionRepository>(() => LibraryManager.CollectionRepository));
			TrackRepository track = new(_database);
			EpisodeRepository episode = new(_database, provider, show, track);

			LibraryManager = new LibraryManager(new IBaseRepository[] {
				provider,
				library,
				libraryItem,
				collection,
				show,
				season,
				episode,
				track,
				people,
				studio,
				genre
			});
			
			Context.AddTest<Show>();
		}

		public void Dispose()
		{
			_database.Dispose();
			Context.Dispose();
			GC.SuppressFinalize(this);
		}

		public async ValueTask DisposeAsync()
		{
			await _database.DisposeAsync();
			await Context.DisposeAsync();
		}
	}
	
	
	public abstract class RepositoryTests<T> : IClassFixture<RepositoryActivator>
		where T : class, IResource
	{
		private readonly RepositoryActivator _repositories;
		private readonly IRepository<T> _repository;

		protected RepositoryTests(RepositoryActivator repositories)
		{
			_repositories = repositories;
			_repository = _repositories.LibraryManager.GetRepository<T>();
		}

		// TODO test libraries & repositories via a on-memory SQLite database.

		[Fact]
		public async Task FillTest()
		{
			await using DatabaseContext database = _repositories.Context.New();

			Assert.Equal(1, database.Shows.Count());
		}

		[Fact]
		public async Task GetByIdTest()
		{
			T value = await _repository.Get(TestSample.Get<T>().Slug);
			KAssert.DeepEqual(TestSample.Get<T>(), value);
		}
	}

	public class ShowTests : RepositoryTests<Show>
	{
		public ShowTests(RepositoryActivator repositories)
			: base(repositories)
		{}
	}
}