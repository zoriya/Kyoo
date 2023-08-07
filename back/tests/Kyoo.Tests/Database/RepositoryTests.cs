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
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Postgresql;
using Xunit;

namespace Kyoo.Tests.Database
{
	public abstract class RepositoryTests<T> : IDisposable, IAsyncDisposable
		where T : class, IResource
	{
		protected readonly RepositoryActivator Repositories;
		private readonly IRepository<T> _repository;

		protected RepositoryTests(RepositoryActivator repositories)
		{
			Repositories = repositories;
			_repository = Repositories.LibraryManager.GetRepository<T>();
		}

		public void Dispose()
		{
			Repositories.Dispose();
			GC.SuppressFinalize(this);
		}

		public ValueTask DisposeAsync()
		{
			return Repositories.DisposeAsync();
		}

		[Fact]
		public async Task FillTest()
		{
			await using DatabaseContext database = Repositories.Context.New();

			Assert.Equal(1, database.Shows.Count());
		}

		[Fact]
		public async Task GetByIdTest()
		{
			T value = await _repository.Get(TestSample.Get<T>().Id);
			KAssert.DeepEqual(TestSample.Get<T>(), value);
		}

		[Fact]
		public async Task GetBySlugTest()
		{
			T value = await _repository.Get(TestSample.Get<T>().Slug);
			KAssert.DeepEqual(TestSample.Get<T>(), value);
		}

		[Fact]
		public async Task GetByFakeIdTest()
		{
			await Assert.ThrowsAsync<ItemNotFoundException>(() => _repository.Get(2));
		}

		[Fact]
		public async Task GetByFakeSlugTest()
		{
			await Assert.ThrowsAsync<ItemNotFoundException>(() => _repository.Get("non-existent"));
		}

		[Fact]
		public async Task DeleteByIdTest()
		{
			await _repository.Delete(TestSample.Get<T>().Id);
			Assert.Equal(0, await _repository.GetCount());
		}

		[Fact]
		public async Task DeleteBySlugTest()
		{
			await _repository.Delete(TestSample.Get<T>().Slug);
			Assert.Equal(0, await _repository.GetCount());
		}

		[Fact]
		public async Task DeleteByValueTest()
		{
			await _repository.Delete(TestSample.Get<T>());
			Assert.Equal(0, await _repository.GetCount());
		}

		[Fact]
		public virtual async Task CreateTest()
		{
			await Assert.ThrowsAsync<DuplicatedItemException>(() => _repository.Create(TestSample.Get<T>()));
			await _repository.Delete(TestSample.Get<T>());

			T expected = TestSample.Get<T>();
			expected.Id = 0;
			await _repository.Create(expected);
			KAssert.DeepEqual(expected, await _repository.Get(expected.Slug));
		}

		[Fact]
		public async Task CreateNullTest()
		{
			await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.Create(null!));
		}

		[Fact]
		public async Task CreateIfNotExistNullTest()
		{
			await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.CreateIfNotExists(null!));
		}

		[Fact]
		public virtual async Task CreateIfNotExistTest()
		{
			T expected = TestSample.Get<T>();
			KAssert.DeepEqual(expected, await _repository.CreateIfNotExists(TestSample.Get<T>()));
			await _repository.Delete(TestSample.Get<T>());
			KAssert.DeepEqual(expected, await _repository.CreateIfNotExists(TestSample.Get<T>()));
		}

		// [Fact]
		// public async Task EditNonExistingTest()
		// {
		//	 await Assert.ThrowsAsync<ItemNotFoundException>(() => _repository.Edit(new T { Id = 56 }));
		// }

		[Fact]
		public async Task GetExpressionIDTest()
		{
			KAssert.DeepEqual(TestSample.Get<T>(), await _repository.Get(x => x.Id == TestSample.Get<T>().Id));
		}

		[Fact]
		public async Task GetExpressionSlugTest()
		{
			KAssert.DeepEqual(TestSample.Get<T>(), await _repository.Get(x => x.Slug == TestSample.Get<T>().Slug));
		}

		[Fact]
		public async Task GetExpressionNotFoundTest()
		{
			await Assert.ThrowsAsync<ItemNotFoundException>(() => _repository.Get(x => x.Slug == "non-existing"));
		}

		[Fact]
		public async Task GetOrDefaultTest()
		{
			Assert.Null(await _repository.GetOrDefault(56));
			Assert.Null(await _repository.GetOrDefault("non-existing"));
			Assert.Null(await _repository.GetOrDefault(x => x.Slug == "non-existing"));
		}

		[Fact]
		public async Task GetCountWithFilterTest()
		{
			string slug = TestSample.Get<T>().Slug[2..4];
			Assert.Equal(1, await _repository.GetCount(x => x.Slug.Contains(slug)));
		}

		[Fact]
		public async Task GetAllTest()
		{
			string slug = TestSample.Get<T>().Slug[2..4];
			ICollection<T> ret = await _repository.GetAll(x => x.Slug.Contains(slug));
			Assert.Single(ret);
			KAssert.DeepEqual(TestSample.Get<T>(), ret.First());
		}

		[Fact]
		public async Task DeleteAllTest()
		{
			string slug = TestSample.Get<T>().Slug[2..4];
			await _repository.DeleteAll(x => x.Slug.Contains(slug));
			Assert.Equal(0, await _repository.GetCount());
		}
	}
}
