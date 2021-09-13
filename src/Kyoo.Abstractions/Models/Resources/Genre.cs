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
using Kyoo.Utils;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A genre that allow one to specify categories for shows.
	/// </summary>
	public class Genre : IResource
	{
		/// <inheritdoc />
		public int ID { get; set; }

		/// <inheritdoc />
		public string Slug { get; set; }

		/// <summary>
		/// The name of this genre.
		/// </summary>
		public string Name { get; set; }

		/// <summary>
		/// The list of shows that have this genre.
		/// </summary>
		[LoadableRelation] public ICollection<Show> Shows { get; set; }

		/// <summary>
		/// Create a new, empty <see cref="Genre"/>.
		/// </summary>
		public Genre() { }

		/// <summary>
		/// Create a new <see cref="Genre"/> and specify it's <see cref="Name"/>.
		/// The <see cref="Slug"/> is automatically calculated from it's name.
		/// </summary>
		/// <param name="name">The name of this genre.</param>
		public Genre(string name)
		{
			Slug = Utility.ToSlug(name);
			Name = name;
		}
	}
}
