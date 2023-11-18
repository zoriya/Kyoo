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

using Kyoo.Abstractions.Models;

namespace Kyoo.Abstractions.Controllers
{
	/// <summary>
	/// An interface to interact with the database. Every repository is mapped through here.
	/// </summary>
	public interface ILibraryManager
	{
		IRepository<T> Repository<T>()
			where T : class, IResource;

		/// <summary>
		/// The repository that handle libraries items (a wrapper around shows and collections).
		/// </summary>
		IRepository<ILibraryItem> LibraryItems { get; }

		/// <summary>
		/// The repository that handle collections.
		/// </summary>
		IRepository<Collection> Collections { get; }

		/// <summary>
		/// The repository that handle shows.
		/// </summary>
		IRepository<Movie> Movies { get; }

		/// <summary>
		/// The repository that handle shows.
		/// </summary>
		IRepository<Show> Shows { get; }

		/// <summary>
		/// The repository that handle seasons.
		/// </summary>
		IRepository<Season> Seasons { get; }

		/// <summary>
		/// The repository that handle episodes.
		/// </summary>
		IRepository<Episode> Episodes { get; }

		/// <summary>
		/// The repository that handle people.
		/// </summary>
		IRepository<People> People { get; }

		/// <summary>
		/// The repository that handle studios.
		/// </summary>
		IRepository<Studio> Studios { get; }

		/// <summary>
		/// The repository that handle users.
		/// </summary>
		IRepository<User> Users { get; }
	}
}
