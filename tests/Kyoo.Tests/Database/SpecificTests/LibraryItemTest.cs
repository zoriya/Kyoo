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
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Database
{
	namespace SqLite
	{
		public class LibraryItemTest : ALibraryItemTest
		{
			public LibraryItemTest(ITestOutputHelper output)
				: base(new RepositoryActivator(output)) { }
		}
	}

	namespace PostgreSQL
	{
		[Collection(nameof(Postgresql))]
		public class LibraryItemTest : ALibraryItemTest
		{
			public LibraryItemTest(PostgresFixture postgres, ITestOutputHelper output)
				: base(new RepositoryActivator(output, postgres)) { }
		}
	}

	public abstract class ALibraryItemTest
	{
		private readonly ILibraryItemRepository _repository;
		private readonly RepositoryActivator _repositories;

		protected ALibraryItemTest(RepositoryActivator repositories)
		{
			_repositories = repositories;
			_repository = repositories.LibraryManager.LibraryItemRepository;
		}

		[Fact]
		public async Task CountTest()
		{
			Assert.Equal(2, await _repository.GetCount());
		}

		[Fact]
		public async Task GetShowTests()
		{
			LibraryItem expected = new(TestSample.Get<Show>());
			LibraryItem actual = await _repository.Get(1);
			KAssert.DeepEqual(expected, actual);
		}

		[Fact]
		public async Task GetCollectionTests()
		{
			LibraryItem expected = new(TestSample.Get<Collection>());
			LibraryItem actual = await _repository.Get(-1);
			KAssert.DeepEqual(expected, actual);
		}

		[Fact]
		public async Task GetShowSlugTests()
		{
			LibraryItem expected = new(TestSample.Get<Show>());
			LibraryItem actual = await _repository.Get(TestSample.Get<Show>().Slug);
			KAssert.DeepEqual(expected, actual);
		}

		[Fact]
		public async Task GetCollectionSlugTests()
		{
			LibraryItem expected = new(TestSample.Get<Collection>());
			LibraryItem actual = await _repository.Get(TestSample.Get<Collection>().Slug);
			KAssert.DeepEqual(expected, actual);
		}

		[Fact]
		public async Task GetDuplicatedSlugTests()
		{
			await _repositories.LibraryManager.Create(new Collection
			{
				Slug = TestSample.Get<Show>().Slug,
				Name = "name"
			});
			await Assert.ThrowsAsync<InvalidOperationException>(() => _repository.Get(TestSample.Get<Show>().Slug));
		}
	}
}
