using System.Linq;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Database
{
	namespace SqLite
	{
		public class LibraryTests : ALibraryTests
		{
			public LibraryTests(ITestOutputHelper output)
				: base(new RepositoryActivator(output)) { }
		}
	}

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
		public async Task CreateWithProvider()
		{
			Library library = TestSample.GetNew<Library>();
			library.Providers = new[] { TestSample.Get<Provider>() };
			await _repository.Create(library);
			Library retrieved = await _repository.Get(2);
			await Repositories.LibraryManager.Load(retrieved, x => x.Providers);
			Assert.Equal(1, retrieved.Providers.Count);
			Assert.Equal(TestSample.Get<Provider>().Slug, retrieved.Providers.First().Slug);
		}
	}
}