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
using Microsoft.AspNetCore.Mvc.Filters;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// An attribute to put on most controllers. It handle fields loading (only retuning fields requested and if they
	/// are requested, load them) and help for the <c>where</c> query parameter.
	/// </summary>
	public class ResourceViewAttribute : ActionFilterAttribute
	{
		/// <inheritdoc />
		public override void OnActionExecuting(ActionExecutingContext context)
		{
			if (context.ActionArguments.TryGetValue("where", out object? dic) && dic is Dictionary<string, string> where)
			{
				Dictionary<string, string> nWhere = new(where, StringComparer.InvariantCultureIgnoreCase);
				nWhere.Remove("fields");
				nWhere.Remove("afterID");
				nWhere.Remove("limit");
				nWhere.Remove("reverse");
				foreach ((string key, _) in context.ActionArguments)
					nWhere.Remove(key);
				context.ActionArguments["where"] = nWhere;
			}

			base.OnActionExecuting(context);
		}
	}
}
