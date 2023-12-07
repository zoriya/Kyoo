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
using Kyoo.Utils;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Database
{
	namespace PostgreSQL
	{
		[Collection(nameof(Postgresql))]
		public class ShowTests : AShowTests
		{
			public ShowTests(PostgresFixture postgres, ITestOutputHelper output)
				: base(new RepositoryActivator(output, postgres)) { }
		}
	}

	public abstract class AShowTests : RepositoryTests<Show>
	{
		private readonly IRepository<Show> _repository;

		protected AShowTests(RepositoryActivator repositories)
			: base(repositories)
		{
			_repository = Repositories.LibraryManager.Shows;
		}

		[Fact]
		public async Task EditTest()
		{
			Show value = await _repository.Get(TestSample.Get<Show>().Slug);
			value.Name = "New Title";
			Show edited = await _repository.Edit(value);
			KAssert.DeepEqual(value, edited);

			await using DatabaseContext database = Repositories.Context.New();
			Show show = await database.Shows.FirstAsync();

			KAssert.DeepEqual(show, value);
		}

		[Fact]
		public async Task EditGenreTest()
		{
			Show value = await _repository.Get(TestSample.Get<Show>().Slug);
			value.Genres = new List<Genre> { Genre.Action };
			Show edited = await _repository.Edit(value);

			Assert.Equal(value.Slug, edited.Slug);
			Assert.Equal(value.Genres, edited.Genres);

			await using DatabaseContext database = Repositories.Context.New();
			Show show = await database.Shows.FirstAsync();

			Assert.Equal(value.Slug, show.Slug);
			Assert.Equal(value.Genres, show.Genres);
		}

		[Fact]
		public async Task AddGenreTest()
		{
			Show value = await _repository.Get(TestSample.Get<Show>().Slug);
			value.Genres.Add(Genre.Drama);
			Show edited = await _repository.Edit(value);

			Assert.Equal(value.Slug, edited.Slug);
			Assert.Equal(value.Genres, edited.Genres);

			await using DatabaseContext database = Repositories.Context.New();
			Show show = await database.Shows.FirstAsync();

			Assert.Equal(value.Slug, show.Slug);
			Assert.Equal(value.Genres, show.Genres);
		}

		[Fact]
		public async Task EditStudioTest()
		{
			Show value = await _repository.Get(TestSample.Get<Show>().Slug);
			value.Studio = new Studio("studio");
			Show edited = await _repository.Edit(value);

			Assert.Equal(value.Slug, edited.Slug);
			Assert.Equal("studio", edited.Studio!.Slug);

			await using DatabaseContext database = Repositories.Context.New();
			Show show = await database.Shows.Include(x => x.Studio).FirstAsync();

			Assert.Equal(value.Slug, show.Slug);
			Assert.Equal("studio", show.Studio!.Slug);
		}

		[Fact]
		public async Task EditAliasesTest()
		{
			Show value = await _repository.Get(TestSample.Get<Show>().Slug);
			value.Aliases = new List<string>() { "NiceNewAlias", "SecondAlias" };
			Show edited = await _repository.Edit(value);

			Assert.Equal(value.Slug, edited.Slug);
			Assert.Equal(value.Aliases, edited.Aliases);

			await using DatabaseContext database = Repositories.Context.New();
			Show show = await database.Shows.FirstAsync();

			Assert.Equal(value.Slug, show.Slug);
			Assert.Equal(value.Aliases, show.Aliases);
		}

		// [Fact]
		// public async Task EditPeopleTest()
		// {
		// 	Show value = await _repository.Get(TestSample.Get<Show>().Slug);
		// 	value.People = new[]
		// 	{
		// 		new PeopleRole
		// 		{
		// 			Show = value,
		// 			People = TestSample.Get<People>(),
		// 			ForPeople = false,
		// 			Type = "Actor",
		// 			Role = "NiceCharacter"
		// 		}
		// 	};
		// 	Show edited = await _repository.Edit(value);
		//
		// 	Assert.Equal(value.Slug, edited.Slug);
		// 	Assert.Equal(edited.People!.First().ShowID, value.Id);
		// 	Assert.Equal(
		// 		value.People.Select(x => new { x.Role, x.Slug, x.People.Name }),
		// 		edited.People.Select(x => new { x.Role, x.Slug, x.People.Name }));
		//
		// 	await using DatabaseContext database = Repositories.Context.New();
		// 	Show show = await database.Shows
		// 		.Include(x => x.People)
		// 		.ThenInclude(x => x.People)
		// 		.FirstAsync();
		//
		// 	Assert.Equal(value.Slug, show.Slug);
		// 	Assert.Equal(
		// 		value.People.Select(x => new { x.Role, x.Slug, x.People.Name }),
		// 		show.People!.Select(x => new { x.Role, x.Slug, x.People.Name }));
		// }

		[Fact]
		public async Task EditExternalIDsTest()
		{
			Show value = await _repository.Get(TestSample.Get<Show>().Slug);
			value.ExternalId = new Dictionary<string, MetadataId>()
			{
				["test"] = new() { DataId = "1234" }
			};
			Show edited = await _repository.Edit(value);

			Assert.Equal(value.Slug, edited.Slug);
			KAssert.DeepEqual(value.ExternalId, edited.ExternalId);

			await using DatabaseContext database = Repositories.Context.New();
			Show show = await database.Shows.FirstAsync();

			Assert.Equal(value.Slug, show.Slug);
			KAssert.DeepEqual(value.ExternalId, show.ExternalId);
		}

		[Fact]
		public async Task CreateWithRelationsTest()
		{
			Show expected = TestSample.Get<Show>();
			expected.Id = 0.AsGuid();
			expected.Slug = "created-relation-test";
			expected.ExternalId = new Dictionary<string, MetadataId>
			{
				["test"] = new() { DataId = "ID" }
			};
			expected.Genres = new List<Genre>() { Genre.Action };
			// expected.People = new[]
			// {
			// 	new PeopleRole
			// 	{
			// 		People = TestSample.Get<People>(),
			// 		Show = expected,
			// 		ForPeople = false,
			// 		Role = "actor",
			// 		Type = "actor"
			// 	}
			// };
			expected.Studio = new Studio("studio");
			Show created = await _repository.Create(expected);
			KAssert.DeepEqual(expected, created);

			await using DatabaseContext context = Repositories.Context.New();
			Show retrieved = await context
				.Shows
				// .Include(x => x.People)
				// .ThenInclude(x => x.People)
				.Include(x => x.Studio)
				.FirstAsync(x => x.Id == created.Id);
			// retrieved.People.ForEach(x =>
			// {
			// 	x.Show = null;
			// 	x.People.Roles = null;
			// 	x.People.Poster = null;
			// 	x.People.Thumbnail = null;
			// 	x.People.Logo = null;
			// });
			retrieved.Studio!.Shows = null;
			// expected.People.ForEach(x =>
			// {
			// 	x.Show = null;
			// 	x.People.Roles = null;
			// 	x.People.Poster = null;
			// 	x.People.Thumbnail = null;
			// 	x.People.Logo = null;
			// });

			KAssert.DeepEqual(retrieved, expected);
		}

		[Fact]
		public async Task CreateWithExternalID()
		{
			Show expected = TestSample.Get<Show>();
			expected.Id = 0.AsGuid();
			expected.Slug = "created-relation-test";
			expected.ExternalId = new Dictionary<string, MetadataId>
			{
				["test"] = new() { DataId = "ID" }
			};
			Show created = await _repository.Create(expected);
			KAssert.DeepEqual(expected, created);
			await using DatabaseContext context = Repositories.Context.New();
			Show retrieved = await context.Shows.FirstAsync(x => x.Id == created.Id);
			KAssert.DeepEqual(expected, retrieved);
			Assert.Single(retrieved.ExternalId);
			Assert.Equal("ID", retrieved.ExternalId["test"].DataId);
		}

		[Fact]
		public async Task SlugDuplicationTest()
		{
			Show test = TestSample.Get<Show>();
			test.Id = 0.AsGuid();
			test.Slug = "300";
			Show created = await _repository.Create(test);
			Assert.Equal("300!", created.Slug);
		}

		[Theory]
		[InlineData("test")]
		[InlineData("super")]
		[InlineData("title")]
		[InlineData("TiTlE")]
		[InlineData("SuPeR")]
		public async Task SearchTest(string query)
		{
			Show value = new() { Slug = "super-test", Name = "This is a test title?" };
			await _repository.Create(value);
			ICollection<Show> ret = await _repository.Search(query);
			KAssert.DeepEqual(value, ret.First());
		}

		[Fact]
		public async Task DeleteShowWithEpisodeAndSeason()
		{
			Show show = TestSample.Get<Show>();
			Assert.Equal(1, await _repository.GetCount());
			await _repository.Delete(show);
			Assert.Equal(0, await Repositories.LibraryManager.Shows.GetCount());
			Assert.Equal(0, await Repositories.LibraryManager.Seasons.GetCount());
			Assert.Equal(0, await Repositories.LibraryManager.Episodes.GetCount());
		}
	}
}
