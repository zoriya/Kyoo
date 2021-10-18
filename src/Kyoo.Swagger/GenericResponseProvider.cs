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
using Kyoo.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApplicationModels;

namespace Kyoo.Swagger
{
	/// <summary>
	/// A filter that change <see cref="ProducesResponseTypeAttribute"/>'s
	/// <see cref="ProducesResponseTypeAttribute.Type"/> that where set to <see cref="ActionResult{T}"/> to the
	/// return type of the method.
	/// </summary>
	/// <remarks>
	/// This is only useful when the return type of the method is a generics type and that can't be specified in the
	/// attribute directly (since attributes don't support generics). This should not be used otherwise.
	/// </remarks>
	public class GenericResponseProvider : IApplicationModelProvider
	{
		/// <inheritdoc />
		public int Order => -1;

		/// <inheritdoc />
		public void OnProvidersExecuted(ApplicationModelProviderContext context)
		{ }

		/// <inheritdoc />
		public void OnProvidersExecuting(ApplicationModelProviderContext context)
		{
			foreach (ActionModel action in context.Result.Controllers.SelectMany(x => x.Actions))
			{
				IEnumerable<ProducesResponseTypeAttribute> responses = action.Filters
					.OfType<ProducesResponseTypeAttribute>()
					.Where(x => x.Type == typeof(ActionResult<>));
				foreach (ProducesResponseTypeAttribute response in responses)
				{
					Type type = action.ActionMethod.ReturnType;
					type = Utility.GetGenericDefinition(type, typeof(Task<>))?.GetGenericArguments()[0] ?? type;
					type = Utility.GetGenericDefinition(type, typeof(ActionResult<>))?.GetGenericArguments()[0] ?? type;
					response.Type = type;
				}
			}
		}
	}
}
