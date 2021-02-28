using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Kyoo.Models.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.CommonApi
{
	public class ResourceViewAttribute : ActionFilterAttribute
	{
		public override void OnActionExecuting(ActionExecutingContext context)
		{
			if (context.ActionArguments.TryGetValue("where", out object dic) && dic is Dictionary<string, string> where)
			{
				where.Remove("fields");
				foreach ((string key, _) in context.ActionArguments)
					where.Remove(key);
			}

			string[] fields = string.Join(',', context.HttpContext.Request.Query["fields"]).Split(',');
			
			context.HttpContext.Items["fields"] = fields;
			if (context.ActionDescriptor is ControllerActionDescriptor descriptor)
			{
				Type type = descriptor.MethodInfo.ReturnType;
				type = Utility.GetGenericDefinition(type, typeof(Task<>))?.GetGenericArguments()[0] ?? type;
				type = Utility.GetGenericDefinition(type, typeof(ActionResult<>))?.GetGenericArguments()[0] ?? type;
				type = Utility.GetGenericDefinition(type, typeof(Page<>))?.GetGenericArguments()[0] ?? type;
				
				PropertyInfo[] properties = type.GetProperties()
					.Where(x => x.GetCustomAttribute<LoadableRelationAttribute>() != null)
					.ToArray();
				foreach (string field in fields)
				{
					if (properties.Any(y => string.Equals(y.Name,field, StringComparison.InvariantCultureIgnoreCase)))
						continue;
					context.Result = new BadRequestObjectResult(new
					{
						Error = $"{field} does not exist on {type.Name}."
					});
					return;
				}
			}
			base.OnActionExecuting(context);
		}

		public override async Task OnResultExecutionAsync(ResultExecutingContext context, ResultExecutionDelegate next)
		{
			if (context.Result is ObjectResult result)
				await LoadResultRelations(context, result);
			await base.OnResultExecutionAsync(context, next);
		}

		private static async Task LoadResultRelations(ActionContext context, ObjectResult result)
		{
			if (result.DeclaredType == null)
				return;

			await using ILibraryManager library = context.HttpContext.RequestServices.GetService<ILibraryManager>();
			string[] fields = (string[])context.HttpContext.Items["fields"];
			Type pageType = Utility.GetGenericDefinition(result.DeclaredType, typeof(Page<>));

			
			// TODO loading is case sensitive. Maybe convert them in the first check.
			if (pageType != null)
			{
				foreach (IResource resource in ((dynamic)result.Value).Items)
				{
					foreach (string field in fields!)
						await library!.Load(resource, field);
				}
			}
			else if (result.DeclaredType.IsAssignableTo(typeof(IResource)))
			{
				foreach (string field in fields!)
					await library!.Load((IResource)result.Value, field);
			}
		}
	}
}