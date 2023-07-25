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
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Postgresql;
using Kyoo.Utils;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Database
{
	namespace PostgreSQL
	{
		[Collection(nameof(Postgresql))]
		public class LibraryTests : ALibraryTests
		{
			public LibraryTests(PostgresFixture postgres, ITestOutputHelper output)
				: base(new RepositoryActivator(output, postgres)) { }
		}
	}

	public abstract class ALibraryTests : RepositoryTests<Library>
	{
		private readonly ILibraryRepository _repository;

		protected ALibraryTests(RepositoryActivator repositories)
			: base(repositories)
		{
			_repository = Repositories.LibraryManager.LibraryRepository;
		}

		[Fact]
		public async Task CreateWithoutPathTest()
		{
			Library library = TestSample.GetNew<Library>();
			library.Paths = null;
			await Assert.ThrowsAsync<ArgumentException>(() => _repository.Create(library));
		}

		[Fact]
		public async Task CreateWithEmptySlugTest()
		{
			Library library = TestSample.GetNew<Library>();
			library.Slug = string.Empty;
			await Assert.ThrowsAsync<ArgumentException>(() => _repository.Create(library));
		}

		[Fact]
		public async Task CreateWithNumberSlugTest()
		{
			Library library = TestSample.GetNew<Library>();
			library.Slug = "2";
			Library ret = await _repository.Create(library);
			Assert.Equal("2!", ret.Slug);
		}

		[Fact]
		public async Task CreateWithoutNameTest()
		{
			Library library = TestSample.GetNew<Library>();
			library.Name = null;
			await Assert.ThrowsAsync<ArgumentException>(() => _repository.Create(library));
		}

		[Fact]
		public async Task CreateWithProvider()
		{
			Library library = TestSample.GetNew<Library>();
			library.Providers = new[] { TestSample.Get<Provider>() };
			await _repository.Create(library);
			Library retrieved = await _repository.Get(2);
			await Repositories.LibraryManager.Load(retrieved, x => x.Providers);
			Assert.Single(retrieved.Providers);
			Assert.Equal(TestSample.Get<Provider>().Slug, retrieved.Providers.First().Slug);
		}

		[Fact]
		public async Task EditTest()
		{
			Library value = await _repository.Get(TestSample.Get<Library>().Slug);
			value.Paths = new[] { "/super", "/test" };
			value.Name = "New Title";
			Library edited = await _repository.Edit(value, false);

			await using DatabaseContext database = Repositories.Context.New();
			Library show = await database.Libraries.FirstAsync();

			KAssert.DeepEqual(show, edited);
		}

		[Fact]
		public async Task EditProvidersTest()
		{
			Library value = await _repository.Get(TestSample.Get<Library>().Slug);
			value.Providers = new[]
			{
				TestSample.GetNew<Provider>()
			};
			Library edited = await _repository.Edit(value, false);

			await using DatabaseContext database = Repositories.Context.New();
			Library show = await database.Libraries
				.Include(x => x.Providers)
				.FirstAsync();

			show.Providers.ForEach(x => x.Libraries = null);
			edited.Providers.ForEach(x => x.Libraries = null);
			KAssert.DeepEqual(show, edited);
		}

		[Fact]
		public async Task AddProvidersTest()
		{
			Library value = await _repository.Get(TestSample.Get<Library>().Slug);
			await Repositories.LibraryManager.Load(value, x => x.Providers);
			value.Providers.Add(TestSample.GetNew<Provider>());
			Library edited = await _repository.Edit(value, false);

			await using DatabaseContext database = Repositories.Context.New();
			Library show = await database.Libraries
				.Include(x => x.Providers)
				.FirstAsync();

			show.Providers.ForEach(x => x.Libraries = null);
			edited.Providers.ForEach(x => x.Libraries = null);
			KAssert.DeepEqual(show, edited);
		}

		[Theory]
		[InlineData("test")]
		[InlineData("super")]
		[InlineData("title")]
		[InlineData("TiTlE")]
		[InlineData("SuPeR")]
		public async Task SearchTest(string query)
		{
			Library value = new()
			{
				Slug = "super-test",
				Name = "This is a test title",
				Paths = new[] { "path" }
			};
			await _repository.Create(value);
			ICollection<Library> ret = await _repository.Search(query);
			KAssert.DeepEqual(value, ret.First());
		}
	}
}
