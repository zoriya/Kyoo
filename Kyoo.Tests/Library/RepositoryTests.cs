using System.Linq;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Xunit;

namespace Kyoo.Tests
{
	public abstract class RepositoryTests<T>
		where T : class, IResource
	{
		protected readonly RepositoryActivator Repositories;
		private readonly IRepository<T> _repository;

		protected RepositoryTests(RepositoryActivator repositories)
		{
			Repositories = repositories;
			_repository = Repositories.LibraryManager.GetRepository<T>();
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
	}
}