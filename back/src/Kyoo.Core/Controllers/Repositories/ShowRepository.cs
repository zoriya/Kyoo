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
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Postgresql;
using Kyoo.Utils;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A local repository to handle shows
	/// </summary>
	public class ShowRepository : LocalRepository<Show>
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;

		/// <summary>
		/// A studio repository to handle creation/validation of related studios.
		/// </summary>
		private readonly IRepository<Studio> _studios;

		/// <summary>
		/// A people repository to handle creation/validation of related people.
		/// </summary>
		private readonly IRepository<People> _people;

		/// <inheritdoc />
		protected override Sort<Show> DefaultSort => new Sort<Show>.By(x => x.Name);

		/// <summary>
		/// Create a new <see cref="ShowRepository"/>.
		/// </summary>
		/// <param name="database">The database handle to use</param>
		/// <param name="studios">A studio repository</param>
		/// <param name="people">A people repository</param>
		/// <param name="thumbs">The thumbnail manager used to store images.</param>
		public ShowRepository(DatabaseContext database,
			IRepository<Studio> studios,
			IRepository<People> people,
			IThumbnailsManager thumbs)
			: base(database, thumbs)
		{
			_database = database;
			_studios = studios;
			_people = people;
		}

		/// <inheritdoc />
		public override async Task<ICollection<Show>> Search(string query, Include<Show>? include = default)
		{
			return await Sort(
					AddIncludes(_database.Shows, include)
						.Where(_database.Like<Show>(x => x.Name + " " + x.Slug, $"%{query}%"))
				)
				.Take(20)
				.ToListAsync();
		}

		/// <inheritdoc />
		public override async Task<Show> Create(Show obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync(() => Get(obj.Slug));
			await IRepository<Show>.OnResourceCreated(obj);
			return obj;
		}

		/// <inheritdoc />
		protected override async Task Validate(Show resource)
		{
			resource.Slug ??= Utility.ToSlug(resource.Name);

			await base.Validate(resource);
			if (resource.Studio != null)
			{
				resource.Studio = await _studios.CreateIfNotExists(resource.Studio);
				resource.StudioId = resource.Studio.Id;
			}

			if (resource.People != null)
			{
				foreach (PeopleRole role in resource.People)
				{
					role.People = _database.LocalEntity<People>(role.People.Slug)
						?? await _people.CreateIfNotExists(role.People);
					role.PeopleID = role.People.Id;
					_database.Entry(role).State = EntityState.Added;
				}
			}
		}

		/// <inheritdoc />
		protected override async Task EditRelations(Show resource, Show changed)
		{
			await Validate(changed);

			if (changed.Studio != null || changed.StudioId == null)
			{
				await Database.Entry(resource).Reference(x => x.Studio).LoadAsync();
				resource.Studio = changed.Studio;
			}

			if (changed.People != null)
			{
				await Database.Entry(resource).Collection(x => x.People!).LoadAsync();
				resource.People = changed.People;
			}
		}

		/// <inheritdoc />
		public override async Task Delete(Show obj)
		{
			_database.Remove(obj);
			await _database.SaveChangesAsync();
			await base.Delete(obj);
		}
	}
}
