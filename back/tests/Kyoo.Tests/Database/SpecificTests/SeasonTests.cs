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

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Postgresql;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Database
{
	namespace PostgreSQL
	{
		[Collection(nameof(Postgresql))]
		public class SeasonTests : ASeasonTests
		{
			public SeasonTests(PostgresFixture postgres, ITestOutputHelper output)
				: base(new RepositoryActivator(output, postgres)) { }
		}
	}

	public abstract class ASeasonTests : RepositoryTests<Season>
	{
		private readonly ISeasonRepository _repository;

		protected ASeasonTests(RepositoryActivator repositories)
			: base(repositories)
		{
			_repository = Repositories.LibraryManager.SeasonRepository;
		}

		[Fact]
		public async Task SlugEditTest()
		{
			Season season = await _repository.Get(1);
			Assert.Equal("anohana-s1", season.Slug);
			Show show = new()
			{
				Id = season.ShowID,
				Slug = "new-slug"
			};
			await Repositories.LibraryManager.ShowRepository.Edit(show, false);
			season = await _repository.Get(1);
			Assert.Equal("new-slug-s1", season.Slug);
		}

		[Fact]
		public async Task SeasonNumberEditTest()
		{
			Season season = await _repository.Get(1);
			Assert.Equal("anohana-s1", season.Slug);
			await _repository.Edit(new Season
			{
				Id = 1,
				SeasonNumber = 2,
				ShowID = 1
			}, false);
			season = await _repository.Get(1);
			Assert.Equal("anohana-s2", season.Slug);
		}

		[Fact]
		public async Task SeasonCreationSlugTest()
		{
			Season season = await _repository.Create(new Season
			{
				ShowID = TestSample.Get<Show>().Id,
				SeasonNumber = 2
			});
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s2", season.Slug);
		}

		[Fact]
		public async Task CreateWithExternalIdTest()
		{
			Season season = TestSample.GetNew<Season>();
			season.ExternalId = new[]
			{
				new MetadataId
				{
					Provider = TestSample.Get<Provider>(),
					Link = "link",
					DataId = "id"
				},
				new MetadataId
				{
					Provider = TestSample.GetNew<Provider>(),
					Link = "new-provider-link",
					DataId = "new-id"
				}
			};
			await _repository.Create(season);

			Season retrieved = await _repository.Get(2);
			await Repositories.LibraryManager.Load(retrieved, x => x.ExternalId);
			Assert.Equal(2, retrieved.ExternalId.Count);
			KAssert.DeepEqual(season.ExternalId.First(), retrieved.ExternalId.First());
			KAssert.DeepEqual(season.ExternalId.Last(), retrieved.ExternalId.Last());
		}

		[Fact]
		public async Task EditTest()
		{
			Season value = await _repository.Get(TestSample.Get<Season>().Slug);
			value.Name = "New Title";
			value.Images = new Dictionary<int, string>
			{
				[Images.Poster] = "new-poster"
			};
			await _repository.Edit(value, false);

			await using DatabaseContext database = Repositories.Context.New();
			Season retrieved = await database.Seasons.FirstAsync();

			KAssert.DeepEqual(value, retrieved);
		}

		[Fact]
		public async Task EditMetadataTest()
		{
			Season value = await _repository.Get(TestSample.Get<Season>().Slug);
			value.ExternalId = new[]
			{
				new MetadataId
				{
					Provider = TestSample.Get<Provider>(),
					Link = "link",
					DataId = "id"
				},
			};
			await _repository.Edit(value, false);

			await using DatabaseContext database = Repositories.Context.New();
			Season retrieved = await database.Seasons
				.Include(x => x.ExternalId)
				.ThenInclude(x => x.Provider)
				.FirstAsync();

			KAssert.DeepEqual(value, retrieved);
		}

		[Fact]
		public async Task AddMetadataTest()
		{
			Season value = await _repository.Get(TestSample.Get<Season>().Slug);
			value.ExternalId = new List<MetadataId>
			{
				new()
				{
					Provider = TestSample.Get<Provider>(),
					Link = "link",
					DataId = "id"
				},
			};
			await _repository.Edit(value, false);

			{
				await using DatabaseContext database = Repositories.Context.New();
				Season retrieved = await database.Seasons
					.Include(x => x.ExternalId)
					.ThenInclude(x => x.Provider)
					.FirstAsync();

				KAssert.DeepEqual(value, retrieved);
			}

			value.ExternalId.Add(new MetadataId
			{
				Provider = TestSample.GetNew<Provider>(),
				Link = "link",
				DataId = "id"
			});
			await _repository.Edit(value, false);

			{
				await using DatabaseContext database = Repositories.Context.New();
				Season retrieved = await database.Seasons
					.Include(x => x.ExternalId)
					.ThenInclude(x => x.Provider)
					.FirstAsync();

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
			Season value = new()
			{
				Name = "This is a test super title",
				ShowID = 1
			};
			await _repository.Create(value);
			ICollection<Season> ret = await _repository.Search(query);
			KAssert.DeepEqual(value, ret.First());
		}
	}
}
