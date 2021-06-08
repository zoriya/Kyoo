using System.Linq;
using System.Threading.Tasks;
using Kyoo.Models;
using Xunit;

namespace Kyoo.Tests.SpecificTests
{
	public class GlobalTests
	{
		[Fact]
		public async Task DeleteShowWithEpisodeAndSeason()
		{
			RepositoryActivator repositories = new();
			Show show = TestSample.Get<Show>();
			show.Seasons = new[]
			{
				TestSample.Get<Season>()
			};
			show.Seasons.First().Episodes = new[]
			{
				TestSample.Get<Episode>()
			};
			await repositories.Context.AddAsync(show);

			Assert.Equal(1, await repositories.LibraryManager.ShowRepository.GetCount());
			await repositories.LibraryManager.ShowRepository.Delete(show);
			Assert.Equal(0, await repositories.LibraryManager.ShowRepository.GetCount());
			Assert.Equal(0, await repositories.LibraryManager.SeasonRepository.GetCount());
			Assert.Equal(0, await repositories.LibraryManager.EpisodeRepository.GetCount());
		}
	}
}