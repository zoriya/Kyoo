using System;
using System.Diagnostics.CodeAnalysis;
using System.Threading.Tasks;
using Kyoo.Abstractions.Models;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests.Database
{
	public class GlobalTests : IDisposable, IAsyncDisposable
	{
		private readonly RepositoryActivator _repositories;
		
		public GlobalTests(ITestOutputHelper output)
		{
			 _repositories = new RepositoryActivator(output);
		}

		public void Dispose()
		{
			_repositories.Dispose();
			GC.SuppressFinalize(this);
		}

		public ValueTask DisposeAsync()
		{
			return _repositories.DisposeAsync();
		}
		
		[Fact]
		[SuppressMessage("ReSharper", "EqualExpressionComparison")]
		public void SampleTest()
		{
			Assert.False(ReferenceEquals(TestSample.Get<Show>(), TestSample.Get<Show>()));
		}
	}
}