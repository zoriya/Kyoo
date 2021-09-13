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
using Kyoo.Utils;
using Xunit;

namespace Kyoo.Tests.Utility
{
	public class EnumerableTests
	{
		[Fact]
		public void MapTest()
		{
			int[] list = { 1, 2, 3, 4 };
			Assert.All(list.Map((x, i) => (x, i)), x => Assert.Equal(x.x - 1, x.i));
			Assert.Throws<ArgumentNullException>(() => list.Map(((Func<int, int, int>)null)!));
			list = null;
			Assert.Throws<ArgumentNullException>(() => list!.Map((x, _) => x + 1));
		}

		[Fact]
		public async Task MapAsyncTest()
		{
			int[] list = { 1, 2, 3, 4 };
			await foreach ((int x, int i) in list.MapAsync((x, i) => Task.FromResult((x, i))))
			{
				Assert.Equal(x - 1, i);
			}
			Assert.Throws<ArgumentNullException>(() => list.MapAsync(((Func<int, int, Task<int>>)null)!));
			list = null;
			Assert.Throws<ArgumentNullException>(() => list!.MapAsync((x, _) => Task.FromResult(x + 1)));
		}

		[Fact]
		public async Task SelectAsyncTest()
		{
			int[] list = { 1, 2, 3, 4 };
			int i = 2;
			await foreach (int x in list.SelectAsync(x => Task.FromResult(x + 1)))
			{
				Assert.Equal(i++, x);
			}
			Assert.Throws<ArgumentNullException>(() => list.SelectAsync(((Func<int, Task<int>>)null)!));
			list = null;
			Assert.Throws<ArgumentNullException>(() => list!.SelectAsync(x => Task.FromResult(x + 1)));
		}

		[Fact]
		public async Task ToListAsyncTest()
		{
			int[] expected = { 1, 2, 3, 4 };
			IAsyncEnumerable<int> list = expected.SelectAsync(Task.FromResult);
			Assert.Equal(expected, await list.ToListAsync());
			list = null;
			await Assert.ThrowsAsync<ArgumentNullException>(() => list!.ToListAsync());
		}

		[Fact]
		public void IfEmptyTest()
		{
			int[] list = { 1, 2, 3, 4 };
			list = list.IfEmpty(() => KAssert.Fail("Empty action should not be triggered.")).ToArray();
			Assert.Throws<ArgumentNullException>(() => list.IfEmpty(null!).ToList());
			list = null;
			Assert.Throws<ArgumentNullException>(() => list!.IfEmpty(() => { }).ToList());
			list = Array.Empty<int>();
			Assert.Throws<ArgumentException>(() => list.IfEmpty(() => throw new ArgumentException()).ToList());
			Assert.Empty(list.IfEmpty(() => { }));
		}
	}
}
