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
