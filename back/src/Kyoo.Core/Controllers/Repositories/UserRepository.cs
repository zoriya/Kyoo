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
using System.Data.Common;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Postgresql;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers;

/// <summary>
/// A repository for users.
/// </summary>
/// <remarks>
/// Create a new <see cref="UserRepository"/>
/// </remarks>
public class UserRepository(
	DatabaseContext database,
	DbConnection db,
	SqlVariableContext context,
	IThumbnailsManager thumbs
) : LocalRepository<User>(database, thumbs)
{
	/// <summary>
	/// The database handle
	/// </summary>
	private readonly DatabaseContext _database = database;

	/// <inheritdoc />
	public override async Task<ICollection<User>> Search(
		string query,
		Include<User>? include = default
	)
	{
		return await AddIncludes(_database.Users, include)
			.Where(x => EF.Functions.ILike(x.Username, $"%{query}%"))
			.Take(20)
			.ToListAsync();
	}

	/// <inheritdoc />
	public override async Task<User> Create(User obj)
	{
		// If no users exists, the new one will be an admin. Give it every permissions.
		if (!await _database.Users.AnyAsync())
		{
			obj.Permissions = Enum.GetNames<Group>()
				.Where(x => x != nameof(Group.None))
				.SelectMany(group =>
					Enum.GetNames<Kind>().Select(kind => $"{group}.{kind}".ToLowerInvariant())
				)
				.ToArray();
		}
		await base.Create(obj);
		_database.Entry(obj).State = EntityState.Added;
		await _database.SaveChangesAsync(() => Get(obj.Slug));
		await IRepository<User>.OnResourceCreated(obj);
		return obj;
	}

	/// <inheritdoc />
	public override async Task Delete(User obj)
	{
		_database.Entry(obj).State = EntityState.Deleted;
		await _database.SaveChangesAsync();
		await base.Delete(obj);
	}

	public Task<User?> GetByExternalId(string provider, string id)
	{
		// language=PostgreSQL
		return db.QuerySingle<User>(
			$"""
			select
				u.* -- User as u
				/* includes */
			from
				users as u
			where
				u.external_id->{provider}->>'Id' = {id}
			""",
			new() { ["u"] = typeof(User) },
			(items) => (items[0] as User)!,
			context,
			null,
			null,
			null
		);
	}
}
