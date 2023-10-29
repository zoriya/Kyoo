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

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Postgresql;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Database
{
	namespace PostgreSQL
	{
		[Collection(nameof(Postgresql))]
		public class EpisodeTests : AEpisodeTests
		{
			public EpisodeTests(PostgresFixture postgres, ITestOutputHelper output)
				: base(new RepositoryActivator(output, postgres)) { }
		}
	}

	public abstract class AEpisodeTests : RepositoryTests<Episode>
	{
		private readonly IRepository<Episode> _repository;

		protected AEpisodeTests(RepositoryActivator repositories)
			: base(repositories)
		{

			_repository = repositories.LibraryManager.Episodes;
		}

		[Fact]
		public async Task SlugEditTest()
		{
			Episode episode = await _repository.Get(1);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e1", episode.Slug);
			await Repositories.LibraryManager.Shows.Patch(episode.ShowId, (x) =>
			{
				x.Slug = "new-slug";
				return Task.FromResult(true);
			});
			episode = await _repository.Get(1);
			Assert.Equal("new-slug-s1e1", episode.Slug);
		}

		[Fact]
		public async Task SeasonNumberEditTest()
		{
			Episode episode = await _repository.Get(1);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e1", episode.Slug);
			episode = await _repository.Patch(1, (x) =>
			{
				x.SeasonNumber = 2;
				return Task.FromResult(true);
			});
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s2e1", episode.Slug);
			episode = await _repository.Get(1);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s2e1", episode.Slug);
		}

		[Fact]
		public async Task EpisodeNumberEditTest()
		{
			Episode episode = await _repository.Get(1);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e1", episode.Slug);
			episode = await Repositories.LibraryManager.Episodes.Patch(episode.Id, (x) =>
			{
				x.EpisodeNumber = 2;
				return Task.FromResult(true);
			});
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e2", episode.Slug);
			episode = await _repository.Get(1);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e2", episode.Slug);
		}

		[Fact]
		public async Task EpisodeCreationSlugTest()
		{
			Episode model = TestSample.Get<Episode>();
			model.Id = 0;
			model.ShowId = TestSample.Get<Show>().Id;
			model.SeasonNumber = 2;
			model.EpisodeNumber = 4;
			Episode episode = await _repository.Create(model);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s2e4", episode.Slug);
		}

		[Fact]
		public void AbsoluteSlugTest()
		{
			Assert.Equal($"{TestSample.Get<Show>().Slug}-{TestSample.GetAbsoluteEpisode().AbsoluteNumber}",
				TestSample.GetAbsoluteEpisode().Slug);
		}

		[Fact]
		public async Task EpisodeCreationAbsoluteSlugTest()
		{
			Episode episode = await _repository.Create(TestSample.GetAbsoluteEpisode());
			Assert.Equal($"{TestSample.Get<Show>().Slug}-{TestSample.GetAbsoluteEpisode().AbsoluteNumber}", episode.Slug);
		}

		[Fact]
		public async Task SlugEditAbsoluteTest()
		{
			Episode episode = await _repository.Create(TestSample.GetAbsoluteEpisode());
			await Repositories.LibraryManager.Shows.Patch(episode.ShowId, (x) =>
			{
				x.Slug = "new-slug";
				return Task.FromResult(true);
			});
			episode = await _repository.Get(2);
			Assert.Equal($"new-slug-3", episode.Slug);
		}

		[Fact]
		public async Task AbsoluteNumberEditTest()
		{
			await _repository.Create(TestSample.GetAbsoluteEpisode());
			Episode episode = await _repository.Patch(2, (x) =>
			{
				x.AbsoluteNumber = 56;
				return Task.FromResult(true);
			});
			Assert.Equal($"{TestSample.Get<Show>().Slug}-56", episode.Slug);
			episode = await _repository.Get(2);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-56", episode.Slug);
		}

		[Fact]
		public async Task AbsoluteToNormalEditTest()
		{
			await _repository.Create(TestSample.GetAbsoluteEpisode());
			Episode episode = await _repository.Patch(2, (x) =>
			{
				x.SeasonNumber = 1;
				x.EpisodeNumber = 2;
				return Task.FromResult(true);
			});
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e2", episode.Slug);
			episode = await _repository.Get(2);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s1e2", episode.Slug);
		}

		[Fact]
		public async Task NormalToAbsoluteEditTest()
		{
			Episode episode = await _repository.Get(1);
			episode.SeasonNumber = null;
			episode.AbsoluteNumber = 12;
			episode = await _repository.Edit(episode);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-12", episode.Slug);
			episode = await _repository.Get(1);
			Assert.Equal($"{TestSample.Get<Show>().Slug}-12", episode.Slug);
		}

		[Fact]
		public async Task CreateWithExternalIdTest()
		{
			Episode value = TestSample.GetNew<Episode>();
			value.ExternalId = new Dictionary<string, MetadataId>
			{
				["2"] = new()
				{
					Link = "link",
					DataId = "id"
				},
				["3"] = new()
				{
					Link = "new-provider-link",
					DataId = "new-id"
				}
			};
			await _repository.Create(value);

			Episode retrieved = await _repository.Get(2);
			Assert.Equal(2, retrieved.ExternalId.Count);
			KAssert.DeepEqual(value.ExternalId.First(), retrieved.ExternalId.First());
			KAssert.DeepEqual(value.ExternalId.Last(), retrieved.ExternalId.Last());
		}

		[Fact]
		public async Task EditTest()
		{
			Episode value = await _repository.Get(TestSample.Get<Episode>().Slug);
			value.Name = "New Title";
			value.Poster = new Image("poster");
			await _repository.Edit(value);

			await using DatabaseContext database = Repositories.Context.New();
			Episode retrieved = await database.Episodes.FirstAsync();

			KAssert.DeepEqual(value, retrieved);
		}

		[Fact]
		public async Task EditMetadataTest()
		{
			Episode value = await _repository.Get(TestSample.Get<Episode>().Slug);
			value.ExternalId = new Dictionary<string, MetadataId>
			{
				["1"] = new()
				{
					Link = "link",
					DataId = "id"
				},
			};
			await _repository.Edit(value);

			await using DatabaseContext database = Repositories.Context.New();
			Episode retrieved = await database.Episodes.FirstAsync();

			KAssert.DeepEqual(value, retrieved);
		}

		[Fact]
		public async Task AddMetadataTest()
		{
			Episode value = await _repository.Get(TestSample.Get<Episode>().Slug);
			value.ExternalId = new Dictionary<string, MetadataId>
			{
				["toto"] = new()
				{
					Link = "link",
					DataId = "id"
				},
			};
			await _repository.Edit(value);

			{
				await using DatabaseContext database = Repositories.Context.New();
				Episode retrieved = await database.Episodes.FirstAsync();

				KAssert.DeepEqual(value, retrieved);
			}

			value.ExternalId.Add("test", new MetadataId
			{
				Link = "link",
				DataId = "id"
			});
			await _repository.Edit(value);

			{
				await using DatabaseContext database = Repositories.Context.New();
				Episode retrieved = await database.Episodes.FirstAsync();

				KAssert.DeepEqual(value, retrieved);
			}
		}

		[Theory]
		[InlineData("test")]
		[InlineData("super")]
		[InlineData("title")]
		[InlineData("TiTlE")]
		[InlineData("SuPeR")]
		public async Task SearchTest(string query)
		{
			Episode value = TestSample.Get<Episode>();
			value.Id = 0;
			value.Name = "This is a test super title";
			value.EpisodeNumber = 56;
			await _repository.Create(value);
			ICollection<Episode> ret = await _repository.Search(query);
			KAssert.DeepEqual(value, ret.First());
		}

		[Fact]
		public override async Task CreateTest()
		{
			await Assert.ThrowsAsync<DuplicatedItemException>(() => _repository.Create(TestSample.Get<Episode>()));
			await _repository.Delete(TestSample.Get<Episode>());

			Episode expected = TestSample.Get<Episode>();
			expected.Id = 0;
			expected.ShowId = (await Repositories.LibraryManager.Shows.Create(TestSample.Get<Show>())).Id;
			expected.SeasonId = (await Repositories.LibraryManager.Seasons.Create(TestSample.Get<Season>())).Id;
			await _repository.Create(expected);
			KAssert.DeepEqual(expected, await _repository.Get(expected.Slug));
		}

		[Fact]
		public override async Task CreateIfNotExistTest()
		{
			Episode expected = TestSample.Get<Episode>();
			KAssert.DeepEqual(expected, await _repository.CreateIfNotExists(TestSample.Get<Episode>()));
			await _repository.Delete(TestSample.Get<Episode>());
			expected.ShowId = (await Repositories.LibraryManager.Shows.Create(TestSample.Get<Show>())).Id;
			expected.SeasonId = (await Repositories.LibraryManager.Seasons.Create(TestSample.Get<Season>())).Id;
			KAssert.DeepEqual(expected, await _repository.CreateIfNotExists(expected));
		}
	}
}
