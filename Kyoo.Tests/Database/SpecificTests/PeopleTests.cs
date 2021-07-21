using Kyoo.Controllers;
using Kyoo.Models;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Database
{
	namespace SqLite
	{
		public class PeopleTests : APeopleTests
		{
			public PeopleTests(ITestOutputHelper output)
				: base(new RepositoryActivator(output)) { }
		}
	}

	namespace PostgreSQL
	{
		[Collection(nameof(Postgresql))]
		public class PeopleTests : APeopleTests
		{
			public PeopleTests(PostgresFixture postgres, ITestOutputHelper output)
				: base(new RepositoryActivator(output, postgres)) { }
		}
	}

	public abstract class APeopleTests : RepositoryTests<People>
	{
		private readonly IPeopleRepository _repository;

		protected APeopleTests(RepositoryActivator repositories)
			: base(repositories)
		{
			_repository = Repositories.LibraryManager.PeopleRepository;
		}
	}
}