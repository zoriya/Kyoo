using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Core.Api
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

			List<string> fields = context.HttpContext.Request.Query["fields"]
				.SelectMany(x => x.Split(','))
				.ToList();
			if (fields.Contains("internal"))
			{
				fields.Remove("internal");
				context.HttpContext.Items["internal"] = true;
				// TODO disable SerializeAs attributes when this is true.
			}
			if (context.ActionDescriptor is ControllerActionDescriptor descriptor)
			{
				Type type = descriptor.MethodInfo.ReturnType;
				type = Utility.GetGenericDefinition(type, typeof(Task<>))?.GetGenericArguments()[0] ?? type;
				type = Utility.GetGenericDefinition(type, typeof(ActionResult<>))?.GetGenericArguments()[0] ?? type;
				type = Utility.GetGenericDefinition(type, typeof(Page<>))?.GetGenericArguments()[0] ?? type;

				PropertyInfo[] properties = type.GetProperties()
					.Where(x => x.GetCustomAttribute<LoadableRelationAttribute>() != null)
					.ToArray();
				if (fields.Count == 1 && fields.Contains("all"))
				{
					fields = properties.Select(x => x.Name).ToList();
				}
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
							context.Result = new BadRequestObjectResult(new
							{
								Error = $"{x} does not exist on {type.Name}."
							});
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

			ILibraryManager library = context.HttpContext.RequestServices.GetService<ILibraryManager>();
			ICollection<string> fields = (ICollection<string>)context.HttpContext.Items["fields"];
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
