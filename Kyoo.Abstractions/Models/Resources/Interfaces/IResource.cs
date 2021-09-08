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

using Kyoo.Abstractions.Controllers;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// An interface to represent a resource that can be retrieved from the database.
	/// </summary>
	public interface IResource
	{
		/// <summary>
		/// A unique ID for this type of resource. This can't be changed and duplicates are not allowed.
		/// </summary>
		/// <remarks>
		/// You don't need to specify an ID manually when creating a new resource,
		/// this field is automatically assigned by the <see cref="IRepository{T}"/>.
		/// </remarks>
		public int ID { get; set; }

		/// <summary>
		/// A human-readable identifier that can be used instead of an ID.
		/// A slug must be unique for a type of resource but it can be changed.
		/// </summary>
		/// <remarks>
		/// There is no setter for a slug since it can be computed from other fields.
		/// For example, a season slug is {ShowSlug}-s{SeasonNumber}.
		/// </remarks>
		public string Slug { get; }
	}
}
