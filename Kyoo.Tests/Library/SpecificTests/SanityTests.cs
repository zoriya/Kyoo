using System;
using System.Diagnostics.CodeAnalysis;
using System.Threading.Tasks;
using Kyoo.Models;
using Xunit;

namespace Kyoo.Tests.Library
{
	public class GlobalTests : IDisposable, IAsyncDisposable
	{
		private readonly RepositoryActivator _repositories;
		
		public GlobalTests()
		{
			 _repositories = new RepositoryActivator();
		}

		[Fact]
		[SuppressMessage("ReSharper", "EqualExpressionComparison")]
		public void SampleTest()
		{
			Assert.False(ReferenceEquals(TestSample.Get<Show>(), TestSample.Get<Show>()));
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
	}
}