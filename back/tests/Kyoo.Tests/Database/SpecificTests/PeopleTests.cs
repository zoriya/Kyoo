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
		public class PeopleTests : APeopleTests
		{
			public PeopleTests(PostgresFixture postgres, ITestOutputHelper output)
				: base(new RepositoryActivator(output, postgres)) { }
		}
	}

	public abstract class APeopleTests : RepositoryTests<People>
	{
		private readonly IPeopleRepository _repository;

		protected APeopleTests(RepositoryActivator repositories)
			: base(repositories)
		{
			_repository = Repositories.LibraryManager.PeopleRepository;
		}

		[Fact]
		public async Task CreateWithExternalIdTest()
		{
			People value = TestSample.GetNew<People>();
			value.ExternalId = new Dictionary<string, MetadataId>
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
			await _repository.Create(value);

			People retrieved = await _repository.Get(2);
			Assert.Equal(2, retrieved.ExternalId.Count);
			KAssert.DeepEqual(value.ExternalId.First(), retrieved.ExternalId.First());
			KAssert.DeepEqual(value.ExternalId.Last(), retrieved.ExternalId.Last());
		}

		[Fact]
		public async Task EditTest()
		{
			People value = await _repository.Get(TestSample.Get<People>().Slug);
			value.Name = "New Name";
			value.Poster = new Image("poster");
			await _repository.Edit(value);

			await using DatabaseContext database = Repositories.Context.New();
			People retrieved = await database.People.FirstAsync();

			KAssert.DeepEqual(value, retrieved);
		}

		[Fact]
		public async Task EditMetadataTest()
		{
			People value = await _repository.Get(TestSample.Get<People>().Slug);
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
			People retrieved = await database.People.FirstAsync();

			KAssert.DeepEqual(value, retrieved);
		}

		[Fact]
		public async Task AddMetadataTest()
		{
			People value = await _repository.Get(TestSample.Get<People>().Slug);
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
				People retrieved = await database.People.FirstAsync();
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
				People retrieved = await database.People.FirstAsync();

				KAssert.DeepEqual(value, retrieved);
			}
		}

		[Theory]
		[InlineData("Me")]
		[InlineData("me")]
		[InlineData("na")]
		public async Task SearchTest(string query)
		{
			People value = new()
			{
				Slug = "slug",
				Name = "name",
			};
			await _repository.Create(value);
			ICollection<People> ret = await _repository.Search(query);
			KAssert.DeepEqual(value, ret.First());
		}
	}
}
