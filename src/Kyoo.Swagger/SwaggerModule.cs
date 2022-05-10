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
using System.Reflection;
using Kyoo.Abstractions;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.Extensions.Configuration;
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

		/// <summary>
		/// The configuration instance used to retrieve the server's public url.
		/// </summary>
		private readonly IConfiguration _configuration;

		/// <summary>
		/// Create a new <see cref="SwaggerModule"/>.
		/// </summary>
		/// <param name="configuration">The configuration instance used to retrieve the server's public url.</param>
		public SwaggerModule(IConfiguration configuration)
		{
			_configuration = configuration;
		}

		/// <inheritdoc />
		public void Configure(IServiceCollection services)
		{
			services.AddTransient<IApplicationModelProvider, GenericResponseProvider>();
			services.AddOpenApiDocument(document =>
			{
				document.Title = "Kyoo API";
				// TODO use a real multi-line description in markdown.
				document.Description = "The Kyoo's public API";
				document.Version = Assembly.GetExecutingAssembly().GetName().Version!.ToString(3);
				document.DocumentName = "v1";
				document.UseControllerSummaryAsTagDescription = true;
				document.GenerateExamples = true;
				document.PostProcess = options =>
				{
					options.Info.Contact = new OpenApiContact
					{
						Name = "Kyoo's github",
						Url = "https://github.com/AnonymusRaccoon/Kyoo"
					};
					options.Info.License = new OpenApiLicense
					{
						Name = "GPL-3.0-or-later",
						Url = "https://github.com/AnonymusRaccoon/Kyoo/blob/master/LICENSE"
					};
					options.Servers.Add(new OpenApiServer
					{
						Url = _configuration.GetPublicUrl().ToString(),
						Description = "The currently running kyoo's instance."
					});

					options.Info.ExtensionData ??= new Dictionary<string, object>();
					options.Info.ExtensionData["x-logo"] = new
					{
						url = "/banner.png",
						backgroundColor = "#FFFFFF",
						altText = "Kyoo's logo"
					};
				};
				document.UseApiTags();
				document.SortApis();
				document.AddOperationFilter(x =>
				{
					if (x is AspNetCoreOperationProcessorContext ctx)
						return ctx.ApiDescription.ActionDescriptor.AttributeRouteInfo?.Order != AlternativeRoute;
					return true;
				});
				document.SchemaGenerator.Settings.TypeMappers.Add(new PrimitiveTypeMapper(typeof(Identifier), x =>
				{
					x.IsNullableRaw = false;
					x.Type = JsonObjectType.String | JsonObjectType.Integer;
				}));
				document.SchemaProcessors.Add(new ThumbnailProcessor());

				document.AddSecurity(nameof(Kyoo), new OpenApiSecurityScheme
				{
					Type = OpenApiSecuritySchemeType.Http,
					Scheme = "Bearer",
					BearerFormat = "JWT",
					Description = "The user's bearer"
				});
				document.OperationProcessors.Add(new OperationPermissionProcessor());
			});
		}

		/// <inheritdoc />
		public IEnumerable<IStartupAction> ConfigureSteps => new IStartupAction[]
		{
			SA.New<IApplicationBuilder>(app => app.UseOpenApi(), SA.Before + 1),
			SA.New<IApplicationBuilder>(app => app.UseSwaggerUi3(), SA.Before),
			SA.New<IApplicationBuilder>(app => app.UseReDoc(x =>
			{
				x.Path = "/redoc";
				x.AdditionalSettings["theme"] = new
				{
					colors = new { primary = new { main = "#e13e13" } }
				};
			}), SA.Before)
		};
	}
}
