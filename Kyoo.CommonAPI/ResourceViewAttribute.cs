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

			string[] fields = context.HttpContext.Request.Query["fields"]
				.SelectMany(x => x.Split(','))
				.ToArray();
			if (context.ActionDescriptor is ControllerActionDescriptor descriptor)
			{
				Type type = descriptor.MethodInfo.ReturnType;
				type = Utility.GetGenericDefinition(type, typeof(Task<>))?.GetGenericArguments()[0] ?? type;
				type = Utility.GetGenericDefinition(type, typeof(ActionResult<>))?.GetGenericArguments()[0] ?? type;
				type = Utility.GetGenericDefinition(type, typeof(Page<>))?.GetGenericArguments()[0] ?? type;
				
				PropertyInfo[] properties = type.GetProperties()
					.Where(x => x.GetCustomAttribute<LoadableRelationAttribute>() != null)
					.ToArray();
				fields = fields.Select(x =>
					{
						string property = properties
							.FirstOrDefault(y => string.Equals(x, y.Name, StringComparison.InvariantCultureIgnoreCase))
							?.Name;
						if (property != null)
							return property;
						context.Result = new BadRequestObjectResult(new
						{
							Error = $"{x} does not exist on {type.Name}."
						});
						return null;
					})
					.ToArray();
				if (context.Result != null)
					return;
			}
			context.HttpContext.Items["fields"] = fields;
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