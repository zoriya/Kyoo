using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
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

			context.HttpContext.Items["fields"] = context.HttpContext.Request.Query["fields"].ToArray();
			// TODO Check if fields are loadable properties of the return type. If not, shorfail the request.
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

			
			if (pageType != null)
			{
				foreach (IResource resource in ((Page<IResource>)result.Value).Items)
				{
					foreach (string field in fields!)
						await library!.Load(resource, field);
				}
			}
			else if (result.DeclaredType.IsAssignableTo(typeof(IResource)))
			{
				foreach (string field in fields!)
					await library!.Load(result.Value as IResource, field);
			}
		}
	}
}