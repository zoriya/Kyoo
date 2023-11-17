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
		return typedValue?.ToList() ?? new();
	}

	public override void SetValue(IDbDataParameter parameter, List<T>? value)
	{
		parameter.Value = value; // no need to convert to string[] in this direction
	}
}
