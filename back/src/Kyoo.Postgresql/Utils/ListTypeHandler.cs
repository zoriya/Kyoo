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
using System.Data;
using System.Linq;
using Dapper;

namespace Kyoo.Postgresql.Utils;

// See https://github.com/DapperLib/Dapper/issues/1424
public class ListTypeHandler<T> : SqlMapper.TypeHandler<List<T>>
{
	public override List<T> Parse(object value)
	{
		T[] typedValue = (T[])value; // looks like Dapper did not indicate the property type to Npgsql, so it defaults to string[] (default CLR type for text[] PostgreSQL type)
		return typedValue?.ToList() ?? [];
	}

	public override void SetValue(IDbDataParameter parameter, List<T>? value)
	{
		parameter.Value = value; // no need to convert to string[] in this direction
	}
}
