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

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// Results of a search request.
	/// </summary>
	/// <typeparam name="T">The search item's type.</typeparam>
	public class SearchPage<T> : Page<T>
		where T : IResource
	{
		public SearchPage(
			SearchResult result,
			string @this,
			string? previous,
			string? next,
			string first
		)
			: base(result.Items, @this, previous, next, first)
		{
			Query = result.Query;
		}

		/// <summary>
		/// The query of the search request.
		/// </summary>
		public string? Query { get; init; }

		public class SearchResult
		{
			public string? Query { get; set; }

			public ICollection<T> Items { get; set; }
		}
	}
}
