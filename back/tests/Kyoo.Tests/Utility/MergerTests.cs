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
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using JetBrains.Annotations;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Utils;
using Xunit;

namespace Kyoo.Tests.Utility
{
	public class MergerTests
	{
		[Fact]
		public void NullifyTest()
		{
			Genre genre = new("test")
			{
				ID = 5
			};
			Merger.Nullify(genre);
			Assert.Equal(0, genre.ID);
			Assert.Null(genre.Name);
			Assert.Null(genre.Slug);
		}

		[Fact]
		public void MergeTest()
		{
			Genre genre = new()
			{
				ID = 5
			};
			Genre genre2 = new()
			{
				Name = "test"
			};
			Genre ret = Merger.Merge(genre, genre2);
			Assert.True(ReferenceEquals(genre, ret));
			Assert.Equal(5, ret.ID);
			Assert.Equal("test", genre.Name);
			Assert.Null(genre.Slug);
		}

		[Fact]
		[SuppressMessage("ReSharper", "ExpressionIsAlwaysNull")]
		public void MergeNullTests()
		{
			Genre genre = new()
			{
				ID = 5
			};
			Assert.True(ReferenceEquals(genre, Merger.Merge(genre, null)));
			Assert.True(ReferenceEquals(genre, Merger.Merge(null, genre)));
			Assert.Null(Merger.Merge<Genre>(null, null));
		}

		private class TestIOnMerge : IOnMerge
		{
			public void OnMerge(object other)
			{
				Exception exception = new();
				exception.Data[0] = other;
				throw exception;
			}
		}

		[Fact]
		public void OnMergeTest()
		{
			TestIOnMerge test = new();
			TestIOnMerge test2 = new();
			Assert.Throws<Exception>(() => Merger.Merge(test, test2));
			try
			{
				Merger.Merge(test, test2);
			}
			catch (Exception ex)
			{
				Assert.True(ReferenceEquals(test2, ex.Data[0]));
			}
		}

		private class Test
		{
			public int ID { get; set; }

			public int[] Numbers { get; set; }
		}

		[Fact]
		public void GlobalMergeListTest()
		{
			Test test = new()
			{
				ID = 5,
				Numbers = new[] { 1 }
			};
			Test test2 = new()
			{
				Numbers = new[] { 3 }
			};
			Test ret = Merger.Merge(test, test2);
			Assert.True(ReferenceEquals(test, ret));
			Assert.Equal(5, ret.ID);

			Assert.Equal(2, ret.Numbers.Length);
			Assert.Equal(1, ret.Numbers[0]);
			Assert.Equal(3, ret.Numbers[1]);
		}

		[Fact]
		public void GlobalMergeListDuplicatesTest()
		{
			Test test = new()
			{
				ID = 5,
				Numbers = new[] { 1 }
			};
			Test test2 = new()
			{
				Numbers = new[]
				{
					1,
					3,
					3
				}
			};
			Test ret = Merger.Merge(test, test2);
			Assert.True(ReferenceEquals(test, ret));
			Assert.Equal(5, ret.ID);

			Assert.Equal(4, ret.Numbers.Length);
			Assert.Equal(1, ret.Numbers[0]);
			Assert.Equal(1, ret.Numbers[1]);
			Assert.Equal(3, ret.Numbers[2]);
			Assert.Equal(3, ret.Numbers[3]);
		}

		private class MergeDictionaryTest
		{
			public int ID { get; set; }

			public Dictionary<int, string> Dictionary { get; set; }
		}

		[Fact]
		public void GlobalMergeDictionariesTest()
		{
			MergeDictionaryTest test = new()
			{
				ID = 5,
				Dictionary = new Dictionary<int, string>
				{
					[2] = "two"
				}
			};
			MergeDictionaryTest test2 = new()
			{
				Dictionary = new Dictionary<int, string>
				{
					[3] = "third"
				}
			};
			MergeDictionaryTest ret = Merger.Merge(test, test2);
			Assert.True(ReferenceEquals(test, ret));
			Assert.Equal(5, ret.ID);

			Assert.Equal(2, ret.Dictionary.Count);
			Assert.Equal("two", ret.Dictionary[2]);
			Assert.Equal("third", ret.Dictionary[3]);
		}

		[Fact]
		public void GlobalMergeDictionariesDuplicatesTest()
		{
			MergeDictionaryTest test = new()
			{
				ID = 5,
				Dictionary = new Dictionary<int, string>
				{
					[2] = "two"
				}
			};
			MergeDictionaryTest test2 = new()
			{
				Dictionary = new Dictionary<int, string>
				{
					[2] = "nope",
					[3] = "third"
				}
			};
			MergeDictionaryTest ret = Merger.Merge(test, test2);
			Assert.True(ReferenceEquals(test, ret));
			Assert.Equal(5, ret.ID);

			Assert.Equal(2, ret.Dictionary.Count);
			Assert.Equal("two", ret.Dictionary[2]);
			Assert.Equal("third", ret.Dictionary[3]);
		}

		[Fact]
		public void GlobalMergeListDuplicatesResourcesTest()
		{
			Show test = new()
			{
				ID = 5,
				Genres = new[] { new Genre("test") }
			};
			Show test2 = new()
			{
				Genres = new[]
				{
					new Genre("test"),
					new Genre("test2")
				}
			};
			Show ret = Merger.Merge(test, test2);
			Assert.True(ReferenceEquals(test, ret));
			Assert.Equal(5, ret.ID);

			Assert.Equal(2, ret.Genres.Count);
			Assert.Equal("test", ret.Genres.ToArray()[0].Slug);
			Assert.Equal("test2", ret.Genres.ToArray()[1].Slug);
		}

		[Fact]
		public void MergeListTest()
		{
			int[] first = { 1 };
			int[] second = { 3, 3 };
			int[] ret = Merger.MergeLists(first, second);

			Assert.Equal(3, ret.Length);
			Assert.Equal(1, ret[0]);
			Assert.Equal(3, ret[1]);
			Assert.Equal(3, ret[2]);
		}

		[Fact]
		public void MergeListDuplicateTest()
		{
			int[] first = { 1 };
			int[] second = {
				1,
				3,
				3
			};
			int[] ret = Merger.MergeLists(first, second);

			Assert.Equal(4, ret.Length);
			Assert.Equal(1, ret[0]);
			Assert.Equal(1, ret[1]);
			Assert.Equal(3, ret[2]);
			Assert.Equal(3, ret[3]);
		}

		[Fact]
		public void MergeListDuplicateCustomEqualityTest()
		{
			int[] first = { 1 };
			int[] second = { 3, 2 };
			int[] ret = Merger.MergeLists(first, second, (x, y) => x % 2 == y % 2);

			Assert.Equal(2, ret.Length);
			Assert.Equal(1, ret[0]);
			Assert.Equal(2, ret[1]);
		}

		[Fact]
		public void MergeDictionariesTest()
		{
			Dictionary<int, string> first = new()
			{
				[1] = "test",
				[5] = "value"
			};
			Dictionary<int, string> second = new()
			{
				[3] = "third",
			};
			IDictionary<int, string> ret = Merger.MergeDictionaries(first, second);

			Assert.Equal(3, ret.Count);
			Assert.Equal("test", ret[1]);
			Assert.Equal("value", ret[5]);
			Assert.Equal("third", ret[3]);
		}

		[Fact]
		public void MergeDictionariesDuplicateTest()
		{
			Dictionary<int, string> first = new()
			{
				[1] = "test",
				[5] = "value"
			};
			Dictionary<int, string> second = new()
			{
				[3] = "third",
				[5] = "new-value",
			};
			IDictionary<int, string> ret = Merger.MergeDictionaries(first, second);

			Assert.Equal(3, ret.Count);
			Assert.Equal("test", ret[1]);
			Assert.Equal("value", ret[5]);
			Assert.Equal("third", ret[3]);
		}

		[Fact]
		public void CompleteTest()
		{
			Genre genre = new()
			{
				ID = 5,
				Name = "merged"
			};
			Genre genre2 = new()
			{
				Name = "test"
			};
			Genre ret = Merger.Complete(genre, genre2);
			Assert.True(ReferenceEquals(genre, ret));
			Assert.Equal(5, ret.ID);
			Assert.Equal("test", genre.Name);
			Assert.Null(genre.Slug);
		}

		[Fact]
		public void CompleteDictionaryTest()
		{
			Collection collection = new()
			{
				ID = 5,
				Name = "merged",
			};
			Collection collection2 = new()
			{
				Name = "test",
			};
			Collection ret = Merger.Complete(collection, collection2);
			Assert.True(ReferenceEquals(collection, ret));
			Assert.Equal(5, ret.ID);
			Assert.Equal("test", ret.Name);
			Assert.Null(ret.Slug);
		}

		[Fact]
		public void CompleteDictionaryOutParam()
		{
			Dictionary<string, string> first = new()
			{
				["logo"] = "logo",
				["poster"] = "poster"
			};
			Dictionary<string, string> second = new()
			{
				["poster"] = "new-poster",
				["thumbnail"] = "thumbnails"
			};
			IDictionary<string, string> ret = Merger.CompleteDictionaries(first, second, out bool changed);
			Assert.True(changed);
			Assert.Equal(3, ret.Count);
			Assert.Equal("new-poster", ret["poster"]);
			Assert.Equal("thumbnails", ret["thumbnail"]);
			Assert.Equal("logo", ret["logo"]);
		}

		[Fact]
		public void CompleteDictionaryEqualTest()
		{
			Dictionary<string, string> first = new()
			{
				["poster"] = "poster"
			};
			Dictionary<string, string> second = new()
			{
				["poster"] = "new-poster",
			};
			IDictionary<string, string> ret = Merger.CompleteDictionaries(first, second, out bool changed);
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
			TestMergeSetter first = new()
			{
				Backing = new Dictionary<int, int>
				{
					[2] = 3
				}
			};
			TestMergeSetter second = new()
			{
				Backing = new Dictionary<int, int>()
			};
			Merger.Complete(first, second);
			// This should no call the setter of first so the test should pass.
		}

		[Fact]
		public void MergeDictionaryNoChangeNoSetTest()
		{
			TestMergeSetter first = new()
			{
				Backing = new Dictionary<int, int>
				{
					[2] = 3
				}
			};
			TestMergeSetter second = new()
			{
				Backing = new Dictionary<int, int>()
			};
			Merger.Merge(first, second);
			// This should no call the setter of first so the test should pass.
		}

		[Fact]
		public void MergeDictionaryNullValue()
		{
			Dictionary<string, string> first = new()
			{
				["logo"] = "logo",
				["poster"] = null
			};
			Dictionary<string, string> second = new()
			{
				["poster"] = "new-poster",
				["thumbnail"] = "thumbnails"
			};
			IDictionary<string, string> ret = Merger.MergeDictionaries(first, second, out bool changed);
			Assert.True(changed);
			Assert.Equal(3, ret.Count);
			Assert.Equal("new-poster", ret["poster"]);
			Assert.Equal("thumbnails", ret["thumbnail"]);
			Assert.Equal("logo", ret["logo"]);
		}

		[Fact]
		public void MergeDictionaryNullValueNoChange()
		{
			Dictionary<string, string> first = new()
			{
				["logo"] = "logo",
				["poster"] = null
			};
			Dictionary<string, string> second = new()
			{
				["poster"] = null,
			};
			IDictionary<string, string> ret = Merger.MergeDictionaries(first, second, out bool changed);
			Assert.False(changed);
			Assert.Equal(2, ret.Count);
			Assert.Null(ret["poster"]);
			Assert.Equal("logo", ret["logo"]);
		}

		[Fact]
		public void CompleteDictionaryNullValue()
		{
			Dictionary<string, string> first = new()
			{
				["logo"] = "logo",
				["poster"] = null
			};
			Dictionary<string, string> second = new()
			{
				["poster"] = "new-poster",
				["thumbnail"] = "thumbnails"
			};
			IDictionary<string, string> ret = Merger.CompleteDictionaries(first, second, out bool changed);
			Assert.True(changed);
			Assert.Equal(3, ret.Count);
			Assert.Equal("new-poster", ret["poster"]);
			Assert.Equal("thumbnails", ret["thumbnail"]);
			Assert.Equal("logo", ret["logo"]);
		}

		[Fact]
		public void CompleteDictionaryNullValueNoChange()
		{
			Dictionary<string, string> first = new()
			{
				["logo"] = "logo",
				["poster"] = null
			};
			Dictionary<string, string> second = new()
			{
				["poster"] = null,
			};
			IDictionary<string, string> ret = Merger.CompleteDictionaries(first, second, out bool changed);
			Assert.False(changed);
			Assert.Equal(2, ret.Count);
			Assert.Null(ret["poster"]);
			Assert.Equal("logo", ret["logo"]);
		}
	}
}
