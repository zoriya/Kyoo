using Kyoo.Controllers;
using Kyoo.Models;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Library
{
	namespace SqLite
	{
		public class TrackTests : ATrackTests
		{
			public TrackTests(ITestOutputHelper output)
				: base(new RepositoryActivator(output)) { }
		}
	}


	namespace PostgreSQL
	{
		[Collection(nameof(Postgresql))]
		public class TrackTests : ATrackTests
		{
			public TrackTests(PostgresFixture postgres, ITestOutputHelper output)
				: base(new RepositoryActivator(output, postgres)) { }
		}
	}

	public abstract class ATrackTests : RepositoryTests<Track>
	{
		private readonly ITrackRepository _repository;

		protected ATrackTests(RepositoryActivator repositories)
			: base(repositories)
		{
			_repository = repositories.LibraryManager.TrackRepository;
		}
	}
}