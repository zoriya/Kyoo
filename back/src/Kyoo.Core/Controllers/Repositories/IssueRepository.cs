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
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Postgresql;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers;

public class IssueRepository(DatabaseContext database) : IIssueRepository
{
	public async Task<ICollection<Issue>> GetAll(Filter<Issue>? filter = null)
	{
		return await database.Issues.Where(filter.ToEfLambda()).ToListAsync();
	}

	public Task<int> GetCount(Filter<Issue>? filter = null)
	{
		return database.Issues.Where(filter.ToEfLambda()).CountAsync();
	}

	public async Task<Issue> Upsert(Issue issue)
	{
		issue.AddedDate = DateTime.UtcNow;
		await database.Issues.Upsert(issue).RunAsync();
		return issue;
	}

	public Task DeleteAll(Filter<Issue>? filter = null)
	{
		return database.Issues.Where(filter.ToEfLambda()).ExecuteDeleteAsync();
	}
}
