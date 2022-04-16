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
using Kyoo.Core.Models.Options;
using Kyoo.Utils;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Xunit.Abstractions;

using KTranscoder = Kyoo.Core.Controllers.Transcoder;

namespace Kyoo.Tests.Transcoder
{
	public class TranscoderTests
	{
		private readonly Mock<IFileSystem> _files;
		private readonly ITranscoder _transcoder;

		public TranscoderTests(ITestOutputHelper output)
		{
			_files = new Mock<IFileSystem>();
			_transcoder = new KTranscoder(
				_files.Object,
				Options.Create(new BasicOptions()),
				output.BuildLoggerFor<KTranscoder>()
			);
		}

		[Fact]
		public async Task ListFontsTest()
		{
			Episode episode = TestSample.Get<Episode>();
			_files.Setup(x => x.ListFiles(It.IsAny<string>(), System.IO.SearchOption.TopDirectoryOnly))
				.ReturnsAsync(new[] { "font.ttf", "font.TTF", "toto.ttf" });
			ICollection<Font> fonts = await _transcoder.ListFonts(episode);
			List<string> fontsFiles = fonts.Select(x => x.File).ToList();
			Assert.Equal(3, fonts.Count);
			Assert.Contains("font.TTF", fontsFiles);
			Assert.Contains("font.ttf", fontsFiles);
			Assert.Contains("toto.ttf", fontsFiles);
		}

		[Fact]
		public async Task GetNoFontTest()
		{
			Episode episode = TestSample.Get<Episode>();
			_files.Setup(x => x.GetExtraDirectory(It.IsAny<Episode>()))
				.ReturnsAsync("/path");
			_files.Setup(x => x.ListFiles(It.IsAny<string>(), System.IO.SearchOption.TopDirectoryOnly))
				.ReturnsAsync(new[] { "font.ttf", "font.TTF", "toto.ttf" });
			Font font = await _transcoder.GetFont(episode, "toto.ttf");
			Assert.Null(font);
		}

		[Fact]
		public async Task GetFontTest()
		{
			Episode episode = TestSample.Get<Episode>();
			_files.Setup(x => x.GetExtraDirectory(It.IsAny<Episode>()))
				.ReturnsAsync("/path");
			_files.Setup(x => x.ListFiles(It.IsAny<string>(), System.IO.SearchOption.TopDirectoryOnly))
				.ReturnsAsync(new[] { "/path/font.ttf", "/path/font.TTF", "/path/toto.ttf" });
			Font font = await _transcoder.GetFont(episode, "toto");
			Assert.NotNull(font);
			Assert.Equal("toto.ttf", font.File);
			Assert.Equal("toto", font.Slug);
			Assert.Equal("ttf", font.Format);
			Assert.Equal("/path/toto.ttf", font.Path);
		}

		[Fact]
		public async Task GetFontNoExtensionTest()
		{
			Episode episode = TestSample.Get<Episode>();
			_files.Setup(x => x.GetExtraDirectory(It.IsAny<Episode>()))
				.ReturnsAsync("/path");
			_files.Setup(x => x.ListFiles(It.IsAny<string>(), System.IO.SearchOption.TopDirectoryOnly))
				.ReturnsAsync(new[] { "/path/font", "/path/toto.ttf" });
			Font font = await _transcoder.GetFont(episode, "font");
			Assert.NotNull(font);
			Assert.Equal("font", font.File);
			Assert.Equal("font", font.Slug);
			Assert.Equal("", font.Format);
			Assert.Equal("/path/font", font.Path);
		}
	}
}
