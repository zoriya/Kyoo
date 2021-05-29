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
		//
		// [Fact]
		// public async Task EditTest()
		// {
		// 	Show value = await _repository.Get(TestSample.Get<Show>().Slug);
		// 	value.Path = "/super";
		// 	value.Title = "New Title";
		// 	Show edited = await _repository.Edit(value, false);
		// 	KAssert.DeepEqual(value, edited);
		//
		// 	await using DatabaseContext database = Repositories.Context.New();
		// 	Show show = await database.Shows.FirstAsync();
		// 	
		// 	KAssert.DeepEqual(show, value);
		// }
	}
}