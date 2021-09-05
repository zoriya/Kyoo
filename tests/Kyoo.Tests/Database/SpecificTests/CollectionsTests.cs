using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Database;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Database
{
	namespace SqLite
	{
		public class CollectionTests : ACollectionTests
		{
			public CollectionTests(ITestOutputHelper output)
				: base(new RepositoryActivator(output)) { }
		}
	}

	namespace PostgreSQL
	{
		[Collection(nameof(Postgresql))]
		public class CollectionTests : ACollectionTests
		{
			public CollectionTests(PostgresFixture postgres, ITestOutputHelper output)
				: base(new RepositoryActivator(output, postgres)) { }
		}
	}

	public abstract class ACollectionTests : RepositoryTests<Collection>
	{
		private readonly ICollectionRepository _repository;

		protected ACollectionTests(RepositoryActivator repositories)
			: base(repositories)
		{
			_repository = Repositories.LibraryManager.CollectionRepository;
		}

		[Fact]
		public async Task CreateWithEmptySlugTest()
		{
			Collection collection = TestSample.GetNew<Collection>();
			collection.Slug = "";
			await Assert.ThrowsAsync<ArgumentException>(() => _repository.Create(collection));
		}

		[Fact]
		public async Task CreateWithNumberSlugTest()
		{
			Collection collection = TestSample.GetNew<Collection>();
			collection.Slug = "2";
			Collection ret = await _repository.Create(collection);
			Assert.Equal("2!", ret.Slug);
		}

		[Fact]
		public async Task CreateWithoutNameTest()
		{
			Collection collection = TestSample.GetNew<Collection>();
			collection.Name = null;
			await Assert.ThrowsAsync<ArgumentException>(() => _repository.Create(collection));
		}

		[Fact]
		public async Task CreateWithExternalIdTest()
		{
			Collection collection = TestSample.GetNew<Collection>();
			collection.ExternalIDs = new[]
			{
				new MetadataID
				{
					Provider = TestSample.Get<Provider>(),
					Link = "link",
					DataID = "id"
				},
				new MetadataID
				{
					Provider = TestSample.GetNew<Provider>(),
					Link = "new-provider-link",
					DataID = "new-id"
				}
			};
			await _repository.Create(collection);

			Collection retrieved = await _repository.Get(2);
			await Repositories.LibraryManager.Load(retrieved, x => x.ExternalIDs);
			Assert.Equal(2, retrieved.ExternalIDs.Count);
			KAssert.DeepEqual(collection.ExternalIDs.First(), retrieved.ExternalIDs.First());
			KAssert.DeepEqual(collection.ExternalIDs.Last(), retrieved.ExternalIDs.Last());
		}

		[Fact]
		public async Task EditTest()
		{
			Collection value = await _repository.Get(TestSample.Get<Collection>().Slug);
			value.Name = "New Title";
			value.Images = new Dictionary<int, string>
			{
				[Images.Poster] = "new-poster"
			};
			await _repository.Edit(value, false);

			await using DatabaseContext database = Repositories.Context.New();
			Collection retrieved = await database.Collections.FirstAsync();

			KAssert.DeepEqual(value, retrieved);
		}

		[Fact]
		public async Task EditMetadataTest()
		{
			Collection value = await _repository.Get(TestSample.Get<Collection>().Slug);
			value.ExternalIDs = new[]
			{
				new MetadataID
				{
					Provider = TestSample.Get<Provider>(),
					Link = "link",
					DataID = "id"
				},
			};
			await _repository.Edit(value, false);

			await using DatabaseContext database = Repositories.Context.New();
			Collection retrieved = await database.Collections
				.Include(x => x.ExternalIDs)
				.ThenInclude(x => x.Provider)
				.FirstAsync();

			KAssert.DeepEqual(value, retrieved);
		}

		[Fact]
		public async Task AddMetadataTest()
		{
			Collection value = await _repository.Get(TestSample.Get<Collection>().Slug);
			value.ExternalIDs = new List<MetadataID>
			{
				new()
				{
					Provider = TestSample.Get<Provider>(),
					Link = "link",
					DataID = "id"
				},
			};
			await _repository.Edit(value, false);

			{
				await using DatabaseContext database = Repositories.Context.New();
				Collection retrieved = await database.Collections
					.Include(x => x.ExternalIDs)
					.ThenInclude(x => x.Provider)
					.FirstAsync();

				KAssert.DeepEqual(value, retrieved);
			}

			value.ExternalIDs.Add(new MetadataID
			{
				Provider = TestSample.GetNew<Provider>(),
				Link = "link",
				DataID = "id"
			});
			await _repository.Edit(value, false);

			{
				await using DatabaseContext database = Repositories.Context.New();
				Collection retrieved = await database.Collections
					.Include(x => x.ExternalIDs)
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
			Collection value = new()
			{
				Slug = "super-test",
				Name = "This is a test title",
			};
			await _repository.Create(value);
			ICollection<Collection> ret = await _repository.Search(query);
			KAssert.DeepEqual(value, ret.First());
		}
	}
}
