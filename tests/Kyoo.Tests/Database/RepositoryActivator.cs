using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Controllers;
using Xunit.Abstractions;

namespace Kyoo.Tests
{
	public class RepositoryActivator : IDisposable, IAsyncDisposable
	{
		public TestContext Context { get; }
		public ILibraryManager LibraryManager { get; }


		private readonly List<DatabaseContext> _databases = new();
			
		public RepositoryActivator(ITestOutputHelper output, PostgresFixture postgres = null)
		{
			Context = postgres == null 
				? new SqLiteTestContext(output) 
				: new PostgresTestContext(postgres, output);

			ProviderRepository provider = new(_NewContext());
			LibraryRepository library = new(_NewContext(), provider);
			CollectionRepository collection = new(_NewContext(), provider);
			GenreRepository genre = new(_NewContext());
			StudioRepository studio = new(_NewContext(), provider);
			PeopleRepository people = new(_NewContext(), provider, 
				new Lazy<IShowRepository>(() => LibraryManager.ShowRepository));
			ShowRepository show = new(_NewContext(), studio, people, genre, provider);
			SeasonRepository season = new(_NewContext(), provider);
			LibraryItemRepository libraryItem = new(_NewContext(), 
				new Lazy<ILibraryRepository>(() => LibraryManager.LibraryRepository));
			TrackRepository track = new(_NewContext());
			EpisodeRepository episode = new(_NewContext(), provider, track);
			UserRepository user = new(_NewContext());

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
				genre,
				user
			});
		}

		private DatabaseContext _NewContext()
		{
			DatabaseContext context = Context.New();
			_databases.Add(context);
			return context;
		}

		public void Dispose()
		{
			foreach (DatabaseContext context in _databases)
				context.Dispose();
			Context.Dispose();
			GC.SuppressFinalize(this);
		}

		public async ValueTask DisposeAsync()
		{
			foreach (DatabaseContext context in _databases)
				await context.DisposeAsync();
			await Context.DisposeAsync();
		}
	}
}