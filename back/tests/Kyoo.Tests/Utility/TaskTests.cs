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
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Utils;
using Xunit;

namespace Kyoo.Tests.Utility
{
	public class TaskTests
	{
		[Fact]
		public async Task DefaultIfNullTest()
		{
			Assert.Equal(0, await TaskUtils.DefaultIfNull<int>(null));
			Assert.Equal(1, await TaskUtils.DefaultIfNull(Task.FromResult(1)));
		}

		[Fact]
		public async Task ThenTest()
		{
			await Assert.ThrowsAsync<ArgumentException>(() => Task.FromResult(1)
				.Then(_ => throw new ArgumentException()));
			Assert.Equal(1, await Task.FromResult(1)
				.Then(_ => { }));

			static async Task<int> Faulted()
			{
				await Task.Delay(1);
				throw new ArgumentException();
			}
			await Assert.ThrowsAsync<ArgumentException>(() => Faulted().Then(_ => KAssert.Fail()));

			static async Task<int> Infinite()
			{
				await Task.Delay(100000);
				return 1;
			}

			CancellationTokenSource token = new();
			token.Cancel();
			await Assert.ThrowsAsync<TaskCanceledException>(() => Task.Run(Infinite, token.Token)
				.Then(_ => { }));
		}

		[Fact]
		public async Task MapTest()
		{
			await Assert.ThrowsAsync<ArgumentException>(() => Task.FromResult(1)
				.Map<int, int>(_ => throw new ArgumentException()));
			Assert.Equal(2, await Task.FromResult(1)
				.Map(x => x + 1));

			static async Task<int> Faulted()
			{
				await Task.Delay(1);
				throw new ArgumentException();
			}
			await Assert.ThrowsAsync<ArgumentException>(() => Faulted()
				.Map(x =>
				{
					KAssert.Fail();
					return x;
				}));

			static async Task<int> Infinite()
			{
				await Task.Delay(100000);
				return 1;
			}

			CancellationTokenSource token = new();
			token.Cancel();
			await Assert.ThrowsAsync<TaskCanceledException>(() => Task.Run(Infinite, token.Token)
				.Map(x => x));
		}
	}
}
