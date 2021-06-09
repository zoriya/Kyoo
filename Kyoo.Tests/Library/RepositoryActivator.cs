using System;
using System.Threading.Tasks;
using Kyoo.Controllers;

namespace Kyoo.Tests
{
	public class RepositoryActivator : IDisposable, IAsyncDisposable
	{
		public TestContext Context { get; }
		public ILibraryManager LibraryManager { get; }


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
			ShowRepository show = new(_database, studio, people, genre, provider);
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
}