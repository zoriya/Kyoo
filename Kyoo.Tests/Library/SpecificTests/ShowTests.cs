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
			: base(new RepositoryActivator())
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
		
		// [Fact]
		// public async Task EditPeopleTest()
		// {
		// 	Show value = await _repository.Get(TestSample.Get<Show>().Slug);
		// 	value.People = new[] {new People
		// 	{
		// 		Name = "test"
		// 	}};
		// 	Show edited = await _repository.Edit(value, false);
		// 	
		// 	Assert.Equal(value.Slug, edited.Slug);
		// 	Assert.Equal(value.Genres.Select(x => new{x.Slug, x.Name}), edited.Genres.Select(x => new{x.Slug, x.Name}));
		//
		// 	await using DatabaseContext database = Repositories.Context.New();
		// 	Show show = await database.Shows
		// 		.Include(x => x.Genres)
		// 		.FirstAsync();
		// 	
		// 	Assert.Equal(value.Slug, show.Slug);
		// 	Assert.Equal(value.Genres.Select(x => new{x.Slug, x.Name}), show.Genres.Select(x => new{x.Slug, x.Name}));
		// }
	}
}