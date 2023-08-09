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
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Postgresql;
using Kyoo.Utils;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A local repository to handle people.
	/// </summary>
	public class PeopleRepository : LocalRepository<People>, IPeopleRepository
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;

		/// <summary>
		/// A lazy loaded show repository to validate requests from shows.
		/// </summary>
		private readonly Lazy<IShowRepository> _shows;

		/// <inheritdoc />
		protected override Sort<People> DefaultSort => new Sort<People>.By(x => x.Name);

		/// <summary>
		/// Create a new <see cref="PeopleRepository"/>
		/// </summary>
		/// <param name="database">The database handle</param>
		/// <param name="shows">A lazy loaded show repository</param>
		public PeopleRepository(DatabaseContext database,
			Lazy<IShowRepository> shows)
			: base(database)
		{
			_database = database;
			_shows = shows;
		}

		/// <inheritdoc />
		public override async Task<ICollection<People>> Search(string query)
		{
			return (await Sort(
				_database.People
					.Where(_database.Like<People>(x => x.Name, $"%{query}%"))
				)
				.Take(20)
				.ToListAsync())
				.Select(SetBackingImageSelf)
				.ToList();
		}

		/// <inheritdoc />
		public override async Task<People> Create(People obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync(() => Get(obj.Slug));
			OnResourceCreated(obj);
			return obj;
		}

		/// <inheritdoc />
		protected override async Task Validate(People resource)
		{
			await base.Validate(resource);

			if (resource.Roles != null)
			{
				foreach (PeopleRole role in resource.Roles)
				{
					role.Show = _database.LocalEntity<Show>(role.Show.Slug)
						?? await _shows.Value.CreateIfNotExists(role.Show);
					role.ShowID = role.Show.Id;
					_database.Entry(role).State = EntityState.Added;
				}
			}
		}

		/// <inheritdoc />
		protected override async Task EditRelations(People resource, People changed)
		{
			await Validate(changed);

			if (changed.Roles != null)
			{
				await Database.Entry(resource).Collection(x => x.Roles).LoadAsync();
				resource.Roles = changed.Roles;
			}
		}

		/// <inheritdoc />
		public override async Task Delete(People obj)
		{
			_database.Entry(obj).State = EntityState.Deleted;
			obj.Roles.ForEach(x => _database.Entry(x).State = EntityState.Deleted);
			await _database.SaveChangesAsync();
			await base.Delete(obj);
		}

		/// <inheritdoc />
		public Task<ICollection<PeopleRole>> GetFromShow(int showID,
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default,
			Pagination limit = default)
		{
			return Task.FromResult<ICollection<PeopleRole>>(new List<PeopleRole>());
			// ICollection<PeopleRole> people = await ApplyFilters(_database.PeopleRoles
			// 		.Where(x => x.ShowID == showID)
			// 		.Include(x => x.People),
			// 	x => x.People.Name,
			// 	where,
			// 	sort,
			// 	limit);
			// if (!people.Any() && await _shows.Value.GetOrDefault(showID) == null)
			// 	throw new ItemNotFoundException();
			// foreach (PeopleRole role in people)
			// 	role.ForPeople = true;
			// return people;
		}

		/// <inheritdoc />
		public Task<ICollection<PeopleRole>> GetFromShow(string showSlug,
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default,
			Pagination limit = default)
		{
			return Task.FromResult<ICollection<PeopleRole>>(new List<PeopleRole>());
			// ICollection<PeopleRole> people = await ApplyFilters(_database.PeopleRoles
			// 		.Where(x => x.Show.Slug == showSlug)
			// 		.Include(x => x.People)
			// 		.Include(x => x.Show),
			// 	id => _database.PeopleRoles.FirstOrDefaultAsync(x => x.ID == id),
			// 	x => x.People.Name,
			// 	where,
			// 	sort,
			// 	limit);
			// if (!people.Any() && await _shows.Value.GetOrDefault(showSlug) == null)
			// 	throw new ItemNotFoundException();
			// foreach (PeopleRole role in people)
			// 	role.ForPeople = true;
			// return people;
		}

		/// <inheritdoc />
		public Task<ICollection<PeopleRole>> GetFromPeople(int id,
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default,
			Pagination limit = default)
		{
			return Task.FromResult<ICollection<PeopleRole>>(new List<PeopleRole>());
			// ICollection<PeopleRole> roles = await ApplyFilters(_database.PeopleRoles
			// 		.Where(x => x.PeopleID == id)
			// 		.Include(x => x.Show),
			// 	y => _database.PeopleRoles.FirstOrDefaultAsync(x => x.ID == y),
			// 	x => x.Show.Title,
			// 	where,
			// 	sort,
			// 	limit);
			// if (!roles.Any() && await GetOrDefault(id) == null)
			// 	throw new ItemNotFoundException();
			// return roles;
		}

		/// <inheritdoc />
		public Task<ICollection<PeopleRole>> GetFromPeople(string slug,
			Expression<Func<PeopleRole, bool>> where = null,
			Sort<PeopleRole> sort = default,
			Pagination limit = default)
		{
			return Task.FromResult<ICollection<PeopleRole>>(new List<PeopleRole>());
			// ICollection<PeopleRole> roles = await ApplyFilters(_database.PeopleRoles
			// 		.Where(x => x.People.Slug == slug)
			// 		.Include(x => x.Show),
			// 	id => _database.PeopleRoles.FirstOrDefaultAsync(x => x.ID == id),
			// 	x => x.Show.Title,
			// 	where,
			// 	sort,
			// 	limit);
			// if (!roles.Any() && await GetOrDefault(slug) == null)
			// 	throw new ItemNotFoundException();
			// return roles;
		}
	}
}
