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

using System.Reflection;
using System.Threading.Tasks;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;

namespace Kyoo.Core.Api;

public class FilterBinder : IModelBinder
{
	public Task BindModelAsync(ModelBindingContext bindingContext)
	{
		ValueProviderResult fields = bindingContext.ValueProvider.GetValue(bindingContext.FieldName);
		try
		{
			object? filter = bindingContext.ModelType.GetMethod(nameof(Filter<object>.From))!
				.Invoke(null, new object?[] { fields.FirstValue });
			bindingContext.Result = ModelBindingResult.Success(filter);
			return Task.CompletedTask;
		}
		catch (TargetInvocationException ex)
		{
			throw ex.InnerException!;
		}
	}

	public class Provider : IModelBinderProvider
	{
		public IModelBinder GetBinder(ModelBinderProviderContext context)
		{
			if (context.Metadata.ModelType.Name == "Filter`1")
			{
				return new BinderTypeModelBinder(typeof(FilterBinder));
			}

			return null!;
		}
	}
}
