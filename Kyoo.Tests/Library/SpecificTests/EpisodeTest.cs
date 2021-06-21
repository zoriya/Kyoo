using Kyoo.Models;
using Xunit;

namespace Kyoo.Tests.Library
{
	namespace SqLite
	{
		public class EpisodeTests : AEpisodeTests
		{
			public EpisodeTests()
				: base(new RepositoryActivator()) { }
		}
	}


	namespace PostgreSQL
	{
		[Collection(nameof(Postgresql))]
		public class EpisodeTests : AEpisodeTests
		{
			public EpisodeTests(PostgresFixture postgres)
				: base(new RepositoryActivator(postgres)) { }
		}
	}

	public abstract class AEpisodeTests : RepositoryTests<Episode>
	{
		protected AEpisodeTests(RepositoryActivator repositories) 
			: base(repositories) 
		{ }
	}
}