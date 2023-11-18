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

using System.Linq;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// An class to interact with the database. Every repository is mapped through here.
	/// </summary>
	public class LibraryManager : ILibraryManager
	{
		private readonly IBaseRepository[] _repositories;

		public LibraryManager(
			IRepository<ILibraryItem> libraryItemRepository,
			IRepository<Collection> collectionRepository,
			IRepository<Movie> movieRepository,
			IRepository<Show> showRepository,
			IRepository<Season> seasonRepository,
			IRepository<Episode> episodeRepository,
			IRepository<People> peopleRepository,
			IRepository<Studio> studioRepository,
			IRepository<User> userRepository)
		{
			LibraryItems = libraryItemRepository;
			Collections = collectionRepository;
			Movies = movieRepository;
			Shows = showRepository;
			Seasons = seasonRepository;
			Episodes = episodeRepository;
			People = peopleRepository;
			Studios = studioRepository;
			Users = userRepository;

			_repositories = new IBaseRepository[]
			{
				LibraryItems,
				Collections,
				Movies,
				Shows,
				Seasons,
				Episodes,
				People,
				Studios,
				Users
			};
		}

		/// <inheritdoc />
		public IRepository<ILibraryItem> LibraryItems { get; }

		/// <inheritdoc />
		public IRepository<Collection> Collections { get; }

		/// <inheritdoc />
		public IRepository<Movie> Movies { get; }

		/// <inheritdoc />
		public IRepository<Show> Shows { get; }

		/// <inheritdoc />
		public IRepository<Season> Seasons { get; }

		/// <inheritdoc />
		public IRepository<Episode> Episodes { get; }

		/// <inheritdoc />
		public IRepository<People> People { get; }

		/// <inheritdoc />
		public IRepository<Studio> Studios { get; }

		/// <inheritdoc />
		public IRepository<User> Users { get; }

		public IRepository<T> Repository<T>()
			where T : class, IResource
		{
			return (IRepository<T>)_repositories.First(x => x.RepositoryType == typeof(T));
		}
	}
}
