using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Database
{
	namespace SqLite
	{
		public class StudioTests : AStudioTests
		{
			public StudioTests(ITestOutputHelper output)
				: base(new RepositoryActivator(output)) { }
		}
	}

	namespace PostgreSQL
	{
		[Collection(nameof(Postgresql))]
		public class StudioTests : AStudioTests
		{
			public StudioTests(PostgresFixture postgres, ITestOutputHelper output)
				: base(new RepositoryActivator(output, postgres)) { }
		}
	}

	public abstract class AStudioTests : RepositoryTests<Studio>
	{
		private readonly IStudioRepository _repository;

		protected AStudioTests(RepositoryActivator repositories)
			: base(repositories)
		{
			_repository = Repositories.LibraryManager.StudioRepository;
		}
	}
}
