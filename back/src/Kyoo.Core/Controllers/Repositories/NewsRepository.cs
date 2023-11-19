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
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Postgresql;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A local repository to handle shows
	/// </summary>
	public class NewsRepository : LocalRepository<News>
	{
		public NewsRepository(DatabaseContext database, IThumbnailsManager thumbs)
			: base(database, thumbs)
		{ }

		/// <inheritdoc />
		public override Task<ICollection<News>> Search(string query, Include<News>? include = default)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task<News> Create(News obj)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task<News> CreateIfNotExists(News obj)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task<News> Edit(News edited)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task<News> Patch(int id, Func<News, Task<bool>> patch)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task Delete(int id)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task Delete(string slug)
			=> throw new InvalidOperationException();

		/// <inheritdoc />
		public override Task Delete(News obj)
			=> throw new InvalidOperationException();
	}
}
