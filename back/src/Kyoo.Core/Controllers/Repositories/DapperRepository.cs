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
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Utils;

namespace Kyoo.Core.Controllers;

public class DapperRepository<T> : IRepository<T>
	where T : class, IResource, IQuery
{
	public Type RepositoryType => typeof(T);

	public Task<ICollection<T>> FromIds(IList<int> ids, Include<T>? include = null)
	{
		throw new NotImplementedException();
	}

	public Task<T> Get(int id, Include<T>? include = null)
	{
		throw new NotImplementedException();
	}

	public Task<T> Get(string slug, Include<T>? include = null)
	{
		throw new NotImplementedException();
	}

	public Task<T> Get(Filter<T> filter, Include<T>? include = null)
	{
		throw new NotImplementedException();
	}

	public Task<ICollection<T>> GetAll(Filter<T>? filter = null, Sort<T>? sort = null, Include<T>? include = null, Pagination? limit = null)
	{
		throw new NotImplementedException();
	}

	public Task<int> GetCount(Filter<T>? filter = null)
	{
		throw new NotImplementedException();
	}

	public Task<T?> GetOrDefault(int id, Include<T>? include = null)
	{
		throw new NotImplementedException();
	}

	public Task<T?> GetOrDefault(string slug, Include<T>? include = null)
	{
		throw new NotImplementedException();
	}

	public Task<T?> GetOrDefault(Filter<T>? filter, Include<T>? include = null, Sort<T>? sortBy = null)
	{
		throw new NotImplementedException();
	}

	public Task<ICollection<T>> Search(string query, Include<T>? include = null)
	{
		throw new NotImplementedException();
	}

	public Task<T> Create(T obj) => throw new NotImplementedException();

	public Task<T> CreateIfNotExists(T obj) => throw new NotImplementedException();

	public Task Delete(int id) => throw new NotImplementedException();

	public Task Delete(string slug) => throw new NotImplementedException();

	public Task Delete(T obj) => throw new NotImplementedException();

	public Task DeleteAll(Filter<T> filter) => throw new NotImplementedException();

	public Task<T> Edit(T edited) => throw new NotImplementedException();

	public Task<T> Patch(int id, Func<T, Task<bool>> patch) => throw new NotImplementedException();
}
