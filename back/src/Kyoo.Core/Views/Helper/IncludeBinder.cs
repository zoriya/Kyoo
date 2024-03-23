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
using System.Text.Json.Serialization.Metadata;
using System.Threading.Tasks;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;

namespace Kyoo.Core.Api;

public class IncludeBinder : IModelBinder
{
	private readonly Random _rng = new();

	public Task BindModelAsync(ModelBindingContext bindingContext)
	{
		ValueProviderResult fields = bindingContext.ValueProvider.GetValue(
			bindingContext.FieldName
		);
		try
		{
			object include = bindingContext
				.ModelType.GetMethod(nameof(Include<object>.From))!
				.Invoke(null, new object?[] { fields.FirstValue })!;
			bindingContext.Result = ModelBindingResult.Success(include);
			bindingContext.HttpContext.Items["fields"] = ((dynamic)include).Fields;
			return Task.CompletedTask;
		}
		catch (TargetInvocationException ex)
		{
			throw ex.InnerException!;
		}
	}

	private static readonly IHttpContextAccessor _accessor = new HttpContextAccessor();

	public static void HandleLoadableFields(JsonTypeInfo info)
	{
		foreach (JsonPropertyInfo prop in info.Properties)
		{
			object[] attributes =
				prop.AttributeProvider?.GetCustomAttributes(typeof(LoadableRelationAttribute), true)
				?? [];
			if (attributes.FirstOrDefault() is not LoadableRelationAttribute relation)
				continue;
			prop.ShouldSerialize = (_, _) =>
			{
				if (_accessor?.HttpContext?.Items["fields"] is not ICollection<string> fields)
					return false;
				return fields.Contains(prop.Name, StringComparer.InvariantCultureIgnoreCase);
			};
		}
	}

	public class Provider : IModelBinderProvider
	{
		public IModelBinder GetBinder(ModelBinderProviderContext context)
		{
			if (context.Metadata.ModelType.Name == "Include`1")
			{
				return new BinderTypeModelBinder(typeof(IncludeBinder));
			}

			return null!;
		}
	}
}
