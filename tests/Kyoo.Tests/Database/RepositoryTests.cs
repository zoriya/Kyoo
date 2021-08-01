using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Xunit;

namespace Kyoo.Tests
{
	public abstract class RepositoryTests<T> : IDisposable, IAsyncDisposable
		where T : class, IResource, new()
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
			T value = await _repository.Get(TestSample.Get<T>().ID);
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
			await _repository.Delete(TestSample.Get<T>().ID);
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
		public async Task CreateTest()
		{
			await Assert.ThrowsAsync<DuplicatedItemException>(() => _repository.Create(TestSample.Get<T>()));
			await _repository.Delete(TestSample.Get<T>());

			T expected = TestSample.Get<T>();
			expected.ID = 0;
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
		public async Task CreateIfNotExistTest()
		{
			T expected = TestSample.Get<T>();
			KAssert.DeepEqual(expected, await _repository.CreateIfNotExists(TestSample.Get<T>()));
			await _repository.Delete(TestSample.Get<T>());
			KAssert.DeepEqual(expected, await _repository.CreateIfNotExists(TestSample.Get<T>()));
		}
		
		[Fact]
		public async Task EditNullTest()
		{
			await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.Edit(null!, false));
		}
		
		[Fact]
		public async Task EditNonExistingTest()
		{
			await Assert.ThrowsAsync<ItemNotFoundException>(() => _repository.Edit(new T {ID = 56}, false));
		}

		[Fact]
		public async Task GetExpressionIDTest()
		{
			KAssert.DeepEqual(TestSample.Get<T>(), await _repository.Get(x => x.ID == TestSample.Get<T>().ID));
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
		public async Task GetExpressionNullTest()
		{
			await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.Get((Expression<Func<T, bool>>)null!));
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
			Assert.Equal(1, ret.Count);
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