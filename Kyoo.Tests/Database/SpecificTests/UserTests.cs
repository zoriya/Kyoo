using Kyoo.Controllers;
using Kyoo.Models;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Database
{
	namespace SqLite
	{
		public class UserTests : AUserTests
		{
			public UserTests(ITestOutputHelper output)
				: base(new RepositoryActivator(output)) { }
		}
	}

	namespace PostgreSQL
	{
		[Collection(nameof(Postgresql))]
		public class UserTests : AUserTests
		{
			public UserTests(PostgresFixture postgres, ITestOutputHelper output)
				: base(new RepositoryActivator(output, postgres)) { }
		}
	}

	public abstract class AUserTests : RepositoryTests<User>
	{
		private readonly IUserRepository _repository;

		protected AUserTests(RepositoryActivator repositories)
			: base(repositories)
		{
			_repository = Repositories.LibraryManager.UserRepository;
		}
	}
}