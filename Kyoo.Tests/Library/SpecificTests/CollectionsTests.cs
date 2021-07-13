using Kyoo.Controllers;
using Kyoo.Models;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Library
{
	namespace SqLite
	{
		public class CollectionTests : ACollectionTests
		{
			public CollectionTests(ITestOutputHelper output)
				: base(new RepositoryActivator(output)) { }
		}
	}

	namespace PostgreSQL
	{
		[Collection(nameof(Postgresql))]
		public class CollectionTests : ACollectionTests
		{
			public CollectionTests(PostgresFixture postgres, ITestOutputHelper output)
				: base(new RepositoryActivator(output, postgres)) { }
		}
	}

	public abstract class ACollectionTests : RepositoryTests<Collection>
	{
		private readonly ICollectionRepository _repository;

		protected ACollectionTests(RepositoryActivator repositories)
			: base(repositories)
		{
			_repository = Repositories.LibraryManager.CollectionRepository;
		}
	}
}