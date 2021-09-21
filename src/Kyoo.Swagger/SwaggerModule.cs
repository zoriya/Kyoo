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
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.Extensions.DependencyInjection;
using NJsonSchema;
using NJsonSchema.Generation.TypeMappers;
using NSwag;
using NSwag.Generation.AspNetCore;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Swagger
{
	/// <summary>
	/// A module to enable a swagger interface and an OpenAPI endpoint to document Kyoo.
	/// </summary>
	public class SwaggerModule : IPlugin
	{
		/// <inheritdoc />
		public string Slug => "swagger";

		/// <inheritdoc />
		public string Name => "Swagger";

		/// <inheritdoc />
		public string Description => "A swagger interface and an OpenAPI endpoint to document Kyoo.";

		/// <inheritdoc />
		public Dictionary<string, Type> Configuration => new();

		/// <inheritdoc />
		public void Configure(IServiceCollection services)
		{
			services.AddTransient<IApplicationModelProvider, GenericResponseProvider>();
			services.AddOpenApiDocument(options =>
			{
				options.Title = "Kyoo API";
				// TODO use a real multi-line description in markdown.
				options.Description = "The Kyoo's public API";
				options.Version = "1.0.0";
				options.DocumentName = "v1";
				options.UseControllerSummaryAsTagDescription = true;
				options.GenerateExamples = true;
				options.PostProcess = x =>
				{
					x.Info.Contact = new OpenApiContact
					{
						Name = "Kyoo's github",
						Url = "https://github.com/AnonymusRaccoon/Kyoo"
					};
					x.Info.License = new OpenApiLicense
					{
						Name = "GPL-3.0-or-later",
						Url = "https://github.com/AnonymusRaccoon/Kyoo/blob/master/LICENSE"
					};
				};
				options.AddOperationFilter(x =>
				{
					if (x is AspNetCoreOperationProcessorContext ctx)
						return ctx.ApiDescription.ActionDescriptor.AttributeRouteInfo?.Order != AlternativeRoute;
					return true;
				});
				options.SchemaGenerator.Settings.TypeMappers.Add(new PrimitiveTypeMapper(typeof(Identifier), x =>
				{
					x.IsNullableRaw = false;
					x.Type = JsonObjectType.String | JsonObjectType.Integer;
				}));
			});
		}

		/// <inheritdoc />
		public IEnumerable<IStartupAction> ConfigureSteps => new IStartupAction[]
		{
			SA.New<IApplicationBuilder>(app => app.UseOpenApi(), SA.Before + 1),
			SA.New<IApplicationBuilder>(app => app.UseSwaggerUi3(x =>
			{
				x.OperationsSorter = "alpha";
				x.TagsSorter = "alpha";
			}), SA.Before),
			SA.New<IApplicationBuilder>(app => app.UseReDoc(x =>
			{
				x.Path = "/redoc";
			}), SA.Before)
		};
	}
}
