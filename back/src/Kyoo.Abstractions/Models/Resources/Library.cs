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
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A library containing <see cref="Show"/> and <see cref="Collection"/>.
	/// </summary>
	public class Library : IResource
	{
		/// <inheritdoc />
		public int ID { get; set; }

		/// <inheritdoc />
		public string Slug { get; set; }

		/// <summary>
		/// The name of this library.
		/// </summary>
		public string Name { get; set; }

		/// <summary>
		/// The list of paths that this library is responsible for. This is mainly used by the Scan task.
		/// </summary>
		public string[] Paths { get; set; }

		/// <summary>
		/// The list of shows in this library.
		/// </summary>
		[LoadableRelation] public ICollection<Show> Shows { get; set; }

		/// <summary>
		/// The list of collections in this library.
		/// </summary>
		[LoadableRelation] public ICollection<Collection> Collections { get; set; }
	}
}
