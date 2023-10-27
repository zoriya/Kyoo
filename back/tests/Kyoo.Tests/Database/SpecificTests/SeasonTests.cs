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
		private readonly IRepository<Season> _repository;

		protected ASeasonTests(RepositoryActivator repositories)
			: base(repositories)
		{
			_repository = Repositories.LibraryManager.Seasons;
		}

		[Fact]
		public async Task SlugEditTest()
		{
			Season season = await _repository.Get(1);
			Assert.Equal("anohana-s1", season.Slug);
			await Repositories.LibraryManager.Shows.Patch(season.ShowId, (x) =>
			{
				x.Slug = "new-slug";
				return Task.FromResult(true);
			});
			season = await _repository.Get(1);
			Assert.Equal("new-slug-s1", season.Slug);
		}

		[Fact]
		public async Task SeasonNumberEditTest()
		{
			Season season = await _repository.Get(1);
			Assert.Equal("anohana-s1", season.Slug);
			await _repository.Patch(season.Id, (x) =>
			{
				x.SeasonNumber = 2;
				return Task.FromResult(true);
			}
			);
			season = await _repository.Get(1);
			Assert.Equal("anohana-s2", season.Slug);
		}

		[Fact]
		public async Task SeasonCreationSlugTest()
		{
			Season season = await _repository.Create(new Season
			{
				ShowId = TestSample.Get<Show>().Id,
				SeasonNumber = 2
			});
			Assert.Equal($"{TestSample.Get<Show>().Slug}-s2", season.Slug);
		}

		[Fact]
		public async Task CreateWithExternalIdTest()
		{
			Season season = TestSample.GetNew<Season>();
			season.ExternalId = new Dictionary<string, MetadataId>
			{
				["2"] = new()
				{
					Link = "link",
					DataId = "id"
				},
				["1"] = new()
				{
					Link = "new-provider-link",
					DataId = "new-id"
				}
			};
			await _repository.Create(season);

			Season retrieved = await _repository.Get(2);
			Assert.Equal(2, retrieved.ExternalId.Count);
			KAssert.DeepEqual(season.ExternalId.First(), retrieved.ExternalId.First());
			KAssert.DeepEqual(season.ExternalId.Last(), retrieved.ExternalId.Last());
		}

		[Fact]
		public async Task EditTest()
		{
			Season value = await _repository.Get(TestSample.Get<Season>().Slug);
			value.Name = "New Title";
			value.Poster = new Image("test");
			await _repository.Edit(value);

			await using DatabaseContext database = Repositories.Context.New();
			Season retrieved = await database.Seasons.FirstAsync();

			KAssert.DeepEqual(value, retrieved);
		}

		[Fact]
		public async Task EditMetadataTest()
		{
			Season value = await _repository.Get(TestSample.Get<Season>().Slug);
			value.ExternalId = new Dictionary<string, MetadataId>
			{
				["toto"] = new()
				{
					Link = "link",
					DataId = "id"
				},
			};
			await _repository.Edit(value);

			await using DatabaseContext database = Repositories.Context.New();
			Season retrieved = await database.Seasons.FirstAsync();

			KAssert.DeepEqual(value, retrieved);
		}

		[Fact]
		public async Task AddMetadataTest()
		{
			Season value = await _repository.Get(TestSample.Get<Season>().Slug);
			value.ExternalId = new Dictionary<string, MetadataId>
			{
				["1"] = new()
				{
					Link = "link",
					DataId = "id"
				},
			};
			await _repository.Edit(value);

			{
				await using DatabaseContext database = Repositories.Context.New();
				Season retrieved = await database.Seasons.FirstAsync();

				KAssert.DeepEqual(value, retrieved);
			}

			value.ExternalId.Add("toto", new MetadataId
			{
				Link = "link",
				DataId = "id"
			});
			await _repository.Edit(value);

			{
				await using DatabaseContext database = Repositories.Context.New();
				Season retrieved = await database.Seasons.FirstAsync();

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
				ShowId = 1
			};
			await _repository.Create(value);
			ICollection<Season> ret = await _repository.Search(query);
			KAssert.DeepEqual(value, ret.First());
		}
	}
}
