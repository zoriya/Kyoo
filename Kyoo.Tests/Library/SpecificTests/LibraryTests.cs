using Kyoo.Controllers;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Library
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

	public abstract class ALibraryTests : RepositoryTests<Models.Library>
	{
		private readonly ILibraryRepository _repository;

		protected ALibraryTests(RepositoryActivator repositories)
			: base(repositories)
		{
			_repository = Repositories.LibraryManager.LibraryRepository;
		}
	}
}