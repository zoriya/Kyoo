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
using JetBrains.Annotations;
using Kyoo.Abstractions.Models;
using Kyoo.Utils;
using Xunit;

namespace Kyoo.Tests.Utility
{
	public class MergerTests
	{
		[Fact]
		public void CompleteTest()
		{
			Studio genre = new() { Name = "merged" };
			Studio genre2 = new() { Name = "test", Id = 5.AsGuid(), };
			Studio ret = Merger.Complete(genre, genre2);
			Assert.True(ReferenceEquals(genre, ret));
			Assert.Equal(5.AsGuid(), ret.Id);
			Assert.Equal("test", genre.Name);
			Assert.Null(genre.Slug);
		}

		[Fact]
		public void CompleteDictionaryTest()
		{
			Collection collection = new() { Name = "merged", };
			Collection collection2 = new() { Id = 5.AsGuid(), Name = "test", };
			Collection ret = Merger.Complete(collection, collection2);
			Assert.True(ReferenceEquals(collection, ret));
			Assert.Equal(5.AsGuid(), ret.Id);
			Assert.Equal("test", ret.Name);
			Assert.Null(ret.Slug);
		}

		[Fact]
		public void CompleteDictionaryOutParam()
		{
			Dictionary<string, string> first = new() { ["logo"] = "logo", ["poster"] = "poster" };
			Dictionary<string, string> second =
				new() { ["poster"] = "new-poster", ["thumbnail"] = "thumbnails" };
			IDictionary<string, string> ret = Merger.CompleteDictionaries(
				first,
				second,
				out bool changed
			);
			Assert.True(changed);
			Assert.Equal(3, ret.Count);
			Assert.Equal("new-poster", ret["poster"]);
			Assert.Equal("thumbnails", ret["thumbnail"]);
			Assert.Equal("logo", ret["logo"]);
		}

		[Fact]
		public void CompleteDictionaryEqualTest()
		{
			Dictionary<string, string> first = new() { ["poster"] = "poster" };
			Dictionary<string, string> second = new() { ["poster"] = "new-poster", };
			IDictionary<string, string> ret = Merger.CompleteDictionaries(
				first,
				second,
				out bool changed
			);
			Assert.True(changed);
			Assert.Single(ret);
			Assert.Equal("new-poster", ret["poster"]);
		}

		private class TestMergeSetter
		{
			public Dictionary<int, int> Backing;

			[UsedImplicitly]
			public Dictionary<int, int> Dictionary
			{
				get => Backing;
				set
				{
					Backing = value;
					KAssert.Fail();
				}
			}
		}

		[Fact]
		public void CompleteDictionaryNoChangeNoSetTest()
		{
			TestMergeSetter first = new() { Backing = new Dictionary<int, int> { [2] = 3 } };
			TestMergeSetter second = new() { Backing = new Dictionary<int, int>() };
			Merger.Complete(first, second);
			// This should no call the setter of first so the test should pass.
		}

		[Fact]
		public void CompleteDictionaryNullValue()
		{
			Dictionary<string, string> first = new() { ["logo"] = "logo", ["poster"] = null };
			Dictionary<string, string> second =
				new() { ["poster"] = "new-poster", ["thumbnail"] = "thumbnails" };
			IDictionary<string, string> ret = Merger.CompleteDictionaries(
				first,
				second,
				out bool changed
			);
			Assert.True(changed);
			Assert.Equal(3, ret.Count);
			Assert.Equal("new-poster", ret["poster"]);
			Assert.Equal("thumbnails", ret["thumbnail"]);
			Assert.Equal("logo", ret["logo"]);
		}

		[Fact]
		public void CompleteDictionaryNullValueNoChange()
		{
			Dictionary<string, string> first = new() { ["logo"] = "logo", ["poster"] = null };
			Dictionary<string, string> second = new() { ["poster"] = null, };
			IDictionary<string, string> ret = Merger.CompleteDictionaries(
				first,
				second,
				out bool changed
			);
			Assert.False(changed);
			Assert.Equal(2, ret.Count);
			Assert.Null(ret["poster"]);
			Assert.Equal("logo", ret["logo"]);
		}
	}
}
