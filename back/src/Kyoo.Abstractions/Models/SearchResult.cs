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
	public class SearchResult
	{
		/// <summary>
		/// The query of the search request.
		/// </summary>
		public string Query { get; init; }

		/// <summary>
		/// The collections that matched the search.
		/// </summary>
		public ICollection<Collection> Collections { get; init; }

		/// <summary>
		/// The items that matched the search.
		/// </summary>
		public ICollection<ILibraryItem> Items { get; init; }

		/// <summary>
		/// The movies that matched the search.
		/// </summary>
		public ICollection<Movie> Movies { get; init; }

		/// <summary>
		/// The shows that matched the search.
		/// </summary>
		public ICollection<Show> Shows { get; init; }

		/// <summary>
		/// The episodes that matched the search.
		/// </summary>
		public ICollection<Episode> Episodes { get; init; }

		/// <summary>
		/// The people that matched the search.
		/// </summary>
		public ICollection<People> People { get; init; }

		/// <summary>
		/// The studios that matched the search.
		/// </summary>
		public ICollection<Studio> Studios { get; init; }
	}
}
