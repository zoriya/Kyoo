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
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.Extensions.DependencyInjection;
using Namotion.Reflection;
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
				options.PostProcess = postProcess =>
				{
					postProcess.Info.Contact = new OpenApiContact
					{
						Name = "Kyoo's github",
						Url = "https://github.com/AnonymusRaccoon/Kyoo"
					};
					postProcess.Info.License = new OpenApiLicense
					{
						Name = "GPL-3.0-or-later",
						Url = "https://github.com/AnonymusRaccoon/Kyoo/blob/master/LICENSE"
					};

					// We can't reorder items by assigning the sorted value to the Paths variable since it has no setter.
					List<KeyValuePair<string, OpenApiPathItem>> sorted = postProcess.Paths
						.OrderBy(x => x.Key)
						.ToList();
					postProcess.Paths.Clear();
					foreach ((string key, OpenApiPathItem value) in sorted)
						postProcess.Paths.Add(key, value);

					List<dynamic> tagGroups = (List<dynamic>)postProcess.ExtensionData["x-tagGroups"];
					List<string> tagsWithoutGroup = postProcess.Tags
						.Select(x => x.Name)
						.Where(x => tagGroups
							.SelectMany<dynamic, string>(y => y.tags)
							.All(y => y != x))
						.ToList();
					if (tagsWithoutGroup.Any())
					{
						tagGroups.Add(new
						{
							name = "Others",
							tags = tagsWithoutGroup
						});
					}
				};
				options.AddOperationFilter(x =>
				{
					if (x is AspNetCoreOperationProcessorContext ctx)
						return ctx.ApiDescription.ActionDescriptor.AttributeRouteInfo?.Order != AlternativeRoute;
					return true;
				});
				options.AddOperationFilter(context =>
				{
					ApiDefinitionAttribute def = context.ControllerType.GetCustomAttribute<ApiDefinitionAttribute>();
					string name = def?.Name ?? context.ControllerType.Name;

					context.OperationDescription.Operation.Tags.Add(name);
					if (context.Document.Tags.All(x => x.Name != name))
					{
						context.Document.Tags.Add(new OpenApiTag
						{
							Name = name,
							Description = context.ControllerType.GetXmlDocsSummary()
						});
					}

					if (def == null)
						return true;

					context.Document.ExtensionData ??= new Dictionary<string, object>();
					context.Document.ExtensionData.TryAdd("x-tagGroups", new List<dynamic>());
					List<dynamic> obj = (List<dynamic>)context.Document.ExtensionData["x-tagGroups"];
					dynamic existing = obj.FirstOrDefault(x => x.name == def.Group);
					if (existing != null)
					{
						if (!existing.tags.Contains(def.Name))
							existing.tags.Add(def.Name);
					}
					else
					{
						obj.Add(new
						{
							name = def.Group,
							tags = new List<string> { def.Name }
						});
					}

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
			SA.New<IApplicationBuilder>(app => app.UseSwaggerUi3(), SA.Before),
			SA.New<IApplicationBuilder>(app => app.UseReDoc(x =>
			{
				x.Path = "/redoc";
			}), SA.Before)
		};
	}
}
