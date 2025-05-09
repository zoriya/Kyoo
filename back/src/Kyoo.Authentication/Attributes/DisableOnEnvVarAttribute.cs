using System;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Authentication.Attributes;

/// <summary>
/// Disables the action if the specified environment variable is set to true.
/// </summary>
public class DisableOnEnvVarAttribute(string varName) : Attribute, IResourceFilter
{
	public void OnResourceExecuting(ResourceExecutingContext context)
	{
		var config = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();

		if (config.GetValue(varName, false))
			context.Result = new Microsoft.AspNetCore.Mvc.NotFoundResult();
	}

	public void OnResourceExecuted(ResourceExecutedContext context) { }
}
