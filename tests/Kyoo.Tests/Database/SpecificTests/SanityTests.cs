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
