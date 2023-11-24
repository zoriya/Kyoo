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
using System.Data;
using Dapper;

namespace Kyoo.Utils;

// Only used due to https://github.com/DapperLib/Dapper/issues/332
public class Wrapper
{
	public object Value { get; set; }

	public Wrapper(object value)
	{
		Value = value;
	}

	public class Handler : SqlMapper.TypeHandler<Wrapper>
	{
		public override Wrapper? Parse(object value)
		{
			throw new NotImplementedException("Wrapper should only be used to write");
		}

		public override void SetValue(IDbDataParameter parameter, Wrapper? value)
		{
			parameter.Value = value?.Value;
		}
	}
}
