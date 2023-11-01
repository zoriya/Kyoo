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
using System.ComponentModel.Design;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Core;
using Kyoo.Core.Controllers;
using Kyoo.Postgresql;
using Moq;
using Xunit.Abstractions;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Tests.Database
{
	public class RepositoryActivator : IDisposable, IAsyncDisposable
	{
		public TestContext Context { get; }
		public ILibraryManager LibraryManager { get; }

		private readonly List<DatabaseContext> _databases = new();

		private readonly IBaseRepository[] _repositories;

		public RepositoryActivator(ITestOutputHelper output, PostgresFixture postgres = null)
		{
			Context = new PostgresTestContext(postgres, output);

			Mock<IThumbnailsManager> thumbs = new();
			CollectionRepository collection = new(_NewContext(), thumbs.Object);
			StudioRepository studio = new(_NewContext(), thumbs.Object);
			PeopleRepository people = new(_NewContext(),
				new Lazy<IRepository<Show>>(() => LibraryManager.Shows),
				thumbs.Object);
			MovieRepository movies = new(_NewContext(), studio, people, thumbs.Object);
			ShowRepository show = new(_NewContext(), studio, people, thumbs.Object);
			SeasonRepository season = new(_NewContext(), thumbs.Object);
			LibraryItemRepository libraryItem = new(_NewContext(), thumbs.Object);
			EpisodeRepository episode = new(_NewContext(), show, thumbs.Object);
			UserRepository user = new(_NewContext(), thumbs.Object);

			_repositories = new IBaseRepository[]
			{
				libraryItem,
				collection,
				movies,
				show,
				season,
				episode,
				people,
				studio,
				user
			};

			ServiceCollection container = new();
			container.AddScoped((_) => _NewContext());
			CoreModule.Services = container.BuildServiceProvider();

			LibraryManager = new LibraryManager(
				libraryItem,
				collection,
				movies,
				show,
				season,
				episode,
				people,
				studio,
				user
			);
		}

		public IRepository<T> GetRepository<T>()
			where T : class, IResource
		{
			return _repositories.First(x => x.RepositoryType == typeof(T)) as IRepository<T>;
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
