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
using System.Linq.Expressions;

namespace Kyoo.Utils;

public sealed class ExpressionArgumentReplacer : ExpressionVisitor
{
	private readonly Dictionary<ParameterExpression, Expression> _mapping;

	public ExpressionArgumentReplacer(Dictionary<ParameterExpression, Expression> dict)
	{
		_mapping = dict;
	}

	protected override Expression VisitParameter(ParameterExpression node)
	{
		if (_mapping.TryGetValue(node, out Expression? mappedArgument))
			return Visit(mappedArgument);
		return base.VisitParameter(node);
	}

	public static Expression ReplaceParams(Expression expression, IEnumerable<ParameterExpression> epxParams, params ParameterExpression[] param)
	{
		ExpressionArgumentReplacer replacer = new(
			epxParams
				.Zip(param)
				.ToDictionary(x => x.First, x => x.Second as Expression)
		);
		return replacer.Visit(expression);
	}
}
