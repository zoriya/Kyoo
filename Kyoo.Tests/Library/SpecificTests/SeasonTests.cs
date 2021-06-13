using Kyoo.Controllers;
using Kyoo.Models;

namespace Kyoo.Tests.SpecificTests
{
	public class SeasonTests : RepositoryTests<Season>
	{
		private readonly ISeasonRepository _repository;

		public SeasonTests()
		{
			_repository = Repositories.LibraryManager.SeasonRepository;
		}
	}
}