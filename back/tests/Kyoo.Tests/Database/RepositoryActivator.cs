// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Core.Controllers;
using Kyoo.Postgresql;
using Xunit.Abstractions;

namespace Kyoo.Tests.Database
{
	public class RepositoryActivator : IDisposable, IAsyncDisposable
	{
		public TestContext Context { get; }
		public ILibraryManager LibraryManager { get; }

		private readonly List<DatabaseContext> _databases = new();

		public RepositoryActivator(ITestOutputHelper output, PostgresFixture postgres = null)
		{
			Context = new PostgresTestContext(postgres, output);

			ProviderRepository provider = new(_NewContext());
			LibraryRepository library = new(_NewContext(), provider);
			CollectionRepository collection = new(_NewContext(), provider);
			GenreRepository genre = new(_NewContext());
			StudioRepository studio = new(_NewContext(), provider);
			PeopleRepository people = new(_NewContext(), provider,
				new Lazy<IShowRepository>(() => LibraryManager.ShowRepository));
			ShowRepository show = new(_NewContext(), studio, people, genre, provider);
			SeasonRepository season = new(_NewContext(), show, provider);
			LibraryItemRepository libraryItem = new(_NewContext(),
				new Lazy<ILibraryRepository>(() => LibraryManager.LibraryRepository));
			EpisodeRepository episode = new(_NewContext(), show, provider);
			UserRepository user = new(_NewContext());

			LibraryManager = new LibraryManager(new IBaseRepository[] {
				provider,
				library,
				libraryItem,
				collection,
				show,
				season,
				episode,
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
