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
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Kyoo.Utils;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// The type of item, ether a show, a movie or a collection.
	/// </summary>
	public enum ItemKind
	{
		/// <summary>
		/// The <see cref="ILibraryItem"/> is a <see cref="Show"/>.
		/// </summary>
		Show,

		/// <summary>
		/// The <see cref="ILibraryItem"/> is a Movie.
		/// </summary>
		Movie,

		/// <summary>
		/// The <see cref="ILibraryItem"/> is a <see cref="Collection"/>.
		/// </summary>
		Collection
	}

	public interface ILibraryItem : IResource, IThumbnails, IMetadata, IAddedDate { }
}
