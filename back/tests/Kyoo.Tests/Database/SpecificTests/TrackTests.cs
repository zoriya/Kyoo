// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Database
{
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

		[Fact]
		public async Task SlugEditTest()
		{
			await Repositories.LibraryManager.ShowRepository.Edit(new Show
			{
				ID = 1,
				Slug = "new-slug"
			}, false);
			Track track = await _repository.Get(1);
			Assert.Equal("new-slug-s1e1.eng-1.subtitle", track.Slug);
		}

		[Fact]
		public async Task UndefinedLanguageSlugTest()
		{
			await _repository.Create(new Track
			{
				ID = 5,
				TrackIndex = 0,
				Type = StreamType.Video,
				Language = null,
				EpisodeID = TestSample.Get<Episode>().ID
			});
			Track track = await _repository.Get(5);
			Assert.Equal("anohana-s1e1.und.video", track.Slug);
		}
	}
}
