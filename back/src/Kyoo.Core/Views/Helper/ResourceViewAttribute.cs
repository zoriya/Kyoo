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
using System.Reflection;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;

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
			if (context.ActionArguments.TryGetValue("where", out object dic) && dic is Dictionary<string, string> where)
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

			List<string> fields = context.HttpContext.Request.Query["fields"]
				.SelectMany(x => x.Split(','))
				.ToList();

			if (context.ActionDescriptor is ControllerActionDescriptor descriptor)
			{
				Type type = descriptor.MethodInfo.ReturnType;
				type = Utility.GetGenericDefinition(type, typeof(Task<>))?.GetGenericArguments()[0] ?? type;
				type = Utility.GetGenericDefinition(type, typeof(ActionResult<>))?.GetGenericArguments()[0] ?? type;
				type = Utility.GetGenericDefinition(type, typeof(Page<>))?.GetGenericArguments()[0] ?? type;

				context.HttpContext.Items["ResourceType"] = type.Name;

				PropertyInfo[] properties = type.GetProperties()
					.Where(x => x.GetCustomAttribute<LoadableRelationAttribute>() != null)
					.ToArray();
				if (fields.Count == 1 && fields.Contains("all"))
					fields = properties.Select(x => x.Name).ToList();
				else
				{
					fields = fields
						.Select(x =>
						{
							string property = properties
								.FirstOrDefault(y
									=> string.Equals(x, y.Name, StringComparison.InvariantCultureIgnoreCase))
								?.Name;
							if (property != null)
								return property;
							context.Result = new BadRequestObjectResult(
								new RequestError($"{x} does not exist on {type.Name}.")
							);
							return null;
						})
						.ToList();
					if (context.Result != null)
						return;
				}
			}
			context.HttpContext.Items["fields"] = fields;
			base.OnActionExecuting(context);
		}

		/// <inheritdoc />
		public override async Task OnResultExecutionAsync(ResultExecutingContext context, ResultExecutionDelegate next)
		{
			if (context.Result is ObjectResult result)
				await _LoadResultRelations(context, result);
			await base.OnResultExecutionAsync(context, next);
		}

		private static async Task _LoadResultRelations(ActionContext context, ObjectResult result)
		{
			if (result.DeclaredType == null)
				return;

			ILibraryManager library = context.HttpContext.RequestServices.GetRequiredService<ILibraryManager>();
			ICollection<string> fields = (ICollection<string>)context.HttpContext.Items["fields"];
			Type pageType = Utility.GetGenericDefinition(result.DeclaredType, typeof(Page<>));

			if (pageType != null)
			{
				foreach (IResource resource in ((dynamic)result.Value).Items)
				{
					foreach (string field in fields!)
						await library.Load(resource, field);
				}
			}
			else if (result.DeclaredType.IsAssignableTo(typeof(IResource)))
			{
				foreach (string field in fields!)
					await library.Load((IResource)result.Value, field);
			}
		}
	}
}
