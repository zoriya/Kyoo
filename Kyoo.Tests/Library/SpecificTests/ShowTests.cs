using System;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Kyoo.Tests.SpecificTests
{
	public class ShowTests : RepositoryTests<Show>
	{
		private readonly IShowRepository _repository;

		public ShowTests()
		{
			_repository = Repositories.LibraryManager.ShowRepository;
		}
		
		[Fact]
		public async Task EditTest()
		{
			Show value = await _repository.Get(TestSample.Get<Show>().Slug);
			value.Path = "/super";
			value.Title = "New Title";
			Show edited = await _repository.Edit(value, false);
			KAssert.DeepEqual(value, edited);
		
			await using DatabaseContext database = Repositories.Context.New();
			Show show = await database.Shows.FirstAsync();
			
			KAssert.DeepEqual(show, value);
		}
		
		[Fact]
		public async Task EditGenreTest()
		{
			Show value = await _repository.Get(TestSample.Get<Show>().Slug);
			value.Genres = new[] {new Genre("test")};
			Show edited = await _repository.Edit(value, false);
			
			Assert.Equal(value.Slug, edited.Slug);
			Assert.Equal(value.Genres.Select(x => new{x.Slug, x.Name}), edited.Genres.Select(x => new{x.Slug, x.Name}));
		
			await using DatabaseContext database = Repositories.Context.New();
			Show show = await database.Shows
				.Include(x => x.Genres)
				.FirstAsync();
			
			Assert.Equal(value.Slug, show.Slug);
			Assert.Equal(value.Genres.Select(x => new{x.Slug, x.Name}), show.Genres.Select(x => new{x.Slug, x.Name}));
		}
		
		[Fact]
		public async Task EditStudioTest()
		{
			Show value = await _repository.Get(TestSample.Get<Show>().Slug);
			value.Studio = new Studio("studio");
			Show edited = await _repository.Edit(value, false);
			
			Assert.Equal(value.Slug, edited.Slug);
			Assert.Equal("studio", edited.Studio.Slug);
		
			await using DatabaseContext database = Repositories.Context.New();
			Show show = await database.Shows
				.Include(x => x.Genres)
				.FirstAsync();
			
			Assert.Equal(value.Slug, show.Slug);
			Assert.Equal("studio", edited.Studio.Slug);
		}
		
		[Fact]
		public async Task EditAliasesTest()
		{
			Show value = await _repository.Get(TestSample.Get<Show>().Slug);
			value.Aliases = new[] {"NiceNewAlias", "SecondAlias"};
			Show edited = await _repository.Edit(value, false);
			
			Assert.Equal(value.Slug, edited.Slug);
			Assert.Equal(value.Aliases, edited.Aliases);
		
			await using DatabaseContext database = Repositories.Context.New();
			Show show = await database.Shows.FirstAsync();
			
			Assert.Equal(value.Slug, show.Slug);
			Assert.Equal(value.Aliases, edited.Aliases);
		}
		
		[Fact]
		public async Task EditPeopleTest()
		{
			Show value = await _repository.Get(TestSample.Get<Show>().Slug);
			value.People = new[]
			{
				new PeopleRole
				{
					Show = value,
					People = TestSample.Get<People>(),
					ForPeople = false,
					Type = "Actor",
					Role = "NiceCharacter"
				}
			};
			Show edited = await _repository.Edit(value, false);
			
			Assert.Equal(value.Slug, edited.Slug);
			Assert.Equal(edited.People.First().ShowID, value.ID);
			Assert.Equal(
				value.People.Select(x => new{x.Role, x.Slug, x.People.Name}), 
				edited.People.Select(x => new{x.Role, x.Slug, x.People.Name}));
		
			await using DatabaseContext database = Repositories.Context.New();
			Show show = await database.Shows
				.Include(x => x.People)
				.FirstAsync();
			
			Assert.Equal(value.Slug, show.Slug);
			Assert.Equal(
				value.People.Select(x => new{x.Role, x.Slug, x.People.Name}), 
				edited.People.Select(x => new{x.Role, x.Slug, x.People.Name}));
		}
		
		[Fact]
		public async Task EditExternalIDsTest()
		{
			Show value = await _repository.Get(TestSample.Get<Show>().Slug);
			value.ExternalIDs = new[]
			{
				new MetadataID<Show>()
				{
					First = value,
					Second = new Provider("test", "test.png"),
					DataID = "1234"
				}
			};
			Show edited = await _repository.Edit(value, false);
			
			Assert.Equal(value.Slug, edited.Slug);
			Assert.Equal(
				value.ExternalIDs.Select(x => new {x.DataID, x.Second.Slug}), 
				edited.ExternalIDs.Select(x => new {x.DataID, x.Second.Slug}));
		
			await using DatabaseContext database = Repositories.Context.New();
			Show show = await database.Shows
				.Include(x => x.ExternalIDs)
				.ThenInclude(x => x.Second)
				.FirstAsync();
			
			Assert.Equal(value.Slug, show.Slug);
			Assert.Equal(
				value.ExternalIDs.Select(x => new {x.DataID, x.Second.Slug}), 
				show.ExternalIDs.Select(x => new {x.DataID, x.Second.Slug}));
		}
		
		[Fact]
		public async Task EditResetOldTest()
		{
			Show value = await _repository.Get(TestSample.Get<Show>().Slug);
			Show newValue = new()
			{
				ID = value.ID,
				Title = "Reset"
			};
			
			await Assert.ThrowsAsync<ArgumentException>(() => _repository.Edit(newValue, true));
			
			newValue.Slug = "reset";
			Show edited = await _repository.Edit(newValue, true);
			
			Assert.Equal(value.ID, edited.ID);
			Assert.Null(edited.Overview);
			Assert.Equal("reset", edited.Slug);
			Assert.Equal("Reset", edited.Title);
			Assert.Null(edited.Aliases);
			Assert.Null(edited.ExternalIDs);
			Assert.Null(edited.People);
			Assert.Null(edited.Genres);
			Assert.Null(edited.Studio);
		}
	}
}