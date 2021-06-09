using System;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Models;
using Xunit;

namespace Kyoo.Tests.SpecificTests
{
	public class GlobalTests : IDisposable, IAsyncDisposable
	{
		private readonly RepositoryActivator _repositories;
		
		public GlobalTests()
		{
			 _repositories = new RepositoryActivator();
		}

		[Fact]
		[SuppressMessage("ReSharper", "EqualExpressionComparison")]
		public void SampleTest()
		{
			Assert.False(ReferenceEquals(TestSample.Get<Show>(), TestSample.Get<Show>()));
		}
		
		[Fact]
		public async Task DeleteShowWithEpisodeAndSeason()
		{
			Show show = TestSample.Get<Show>();
			show.Seasons = new[]
			{
				TestSample.Get<Season>()
			};
			show.Seasons.First().Episodes = new[]
			{
				TestSample.Get<Episode>()
			};
			await _repositories.Context.AddAsync(show);

			Assert.Equal(1, await _repositories.LibraryManager.ShowRepository.GetCount());
			await _repositories.LibraryManager.ShowRepository.Delete(show);
			Assert.Equal(0, await _repositories.LibraryManager.ShowRepository.GetCount());
			Assert.Equal(0, await _repositories.LibraryManager.SeasonRepository.GetCount());
			Assert.Equal(0, await _repositories.LibraryManager.EpisodeRepository.GetCount());
		}

		public void Dispose()
		{
			_repositories.Dispose();
			GC.SuppressFinalize(this);
		}

		public ValueTask DisposeAsync()
		{
			return _repositories.DisposeAsync();
		}
	}
}