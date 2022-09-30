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
using Kyoo.Core.Controllers;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Identifier
{
	public class ProviderTests
	{
		private readonly ILoggerFactory _factory;

		public ProviderTests(ITestOutputHelper output)
		{
			_factory = LoggerFactory.Create(x =>
			{
				x.ClearProviders();
				x.AddXunit(output);
			});
		}

		[Fact]
		public async Task NoProviderGetTest()
		{
			AProviderComposite provider = new ProviderComposite(Array.Empty<IMetadataProvider>(),
				_factory.CreateLogger<ProviderComposite>());
			Show show = new()
			{
				ID = 4,
				Genres = new[] { new Genre("genre") }
			};
			Show ret = await provider.Get(show);
			KAssert.DeepEqual(show, ret);
		}

		[Fact]
		public async Task NoProviderSearchTest()
		{
			AProviderComposite provider = new ProviderComposite(Array.Empty<IMetadataProvider>(),
				_factory.CreateLogger<ProviderComposite>());
			ICollection<Show> ret = await provider.Search<Show>("show");
			Assert.Empty(ret);
		}

		[Fact]
		public async Task OneProviderGetTest()
		{
			Show show = new()
			{
				ID = 4,
				Genres = new[] { new Genre("genre") }
			};
			Mock<IMetadataProvider> mock = new();
			mock.Setup(x => x.Get(show)).ReturnsAsync(new Show
			{
				Title = "title",
				Genres = new[] { new Genre("ToMerge") }
			});
			AProviderComposite provider = new ProviderComposite(new[]
				{
					mock.Object
				},
				_factory.CreateLogger<ProviderComposite>());

			Show ret = await provider.Get(show);
			Assert.Equal(4, ret.ID);
			Assert.Equal("title", ret.Title);
			Assert.Equal(2, ret.Genres.Count);
			Assert.Contains("genre", ret.Genres.Select(x => x.Slug));
			Assert.Contains("tomerge", ret.Genres.Select(x => x.Slug));
		}

		[Fact]
		public async Task FailingProviderGetTest()
		{
			Show show = new()
			{
				ID = 4,
				Genres = new[] { new Genre("genre") }
			};
			Mock<IMetadataProvider> mock = new();
			mock.Setup(x => x.Provider).Returns(new Provider("mock", string.Empty));
			mock.Setup(x => x.Get(show)).ReturnsAsync(new Show
			{
				Title = "title",
				Genres = new[] { new Genre("ToMerge") }
			});

			Mock<IMetadataProvider> mockTwo = new();
			mockTwo.Setup(x => x.Provider).Returns(new Provider("mockTwo", string.Empty));
			mockTwo.Setup(x => x.Get(show)).ReturnsAsync(new Show
			{
				Title = "title2",
				Status = Status.Finished,
				Genres = new[] { new Genre("ToMerge") }
			});

			Mock<IMetadataProvider> mockFailing = new();
			mockFailing.Setup(x => x.Provider).Returns(new Provider("mockFail", string.Empty));
			mockFailing.Setup(x => x.Get(show)).Throws<ArgumentException>();

			AProviderComposite provider = new ProviderComposite(new[]
				{
					mock.Object,
					mockTwo.Object,
					mockFailing.Object
				},
				_factory.CreateLogger<ProviderComposite>());

			Show ret = await provider.Get(show);
			Assert.Equal(4, ret.ID);
			Assert.Equal("title", ret.Title);
			Assert.Equal(Status.Finished, ret.Status);
			Assert.Equal(2, ret.Genres.Count);
			Assert.Contains("genre", ret.Genres.Select(x => x.Slug));
			Assert.Contains("tomerge", ret.Genres.Select(x => x.Slug));
		}
	}
}
