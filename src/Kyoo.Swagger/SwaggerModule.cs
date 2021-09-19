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
using System.IO;
using System.Linq;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Attributes;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Models;

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
			services.AddSwaggerGen(options =>
			{
				options.SwaggerDoc("v1", new OpenApiInfo
				{
					Version = "v1",
					Title = "Kyoo API",
					Description = "The Kyoo's public API",
					Contact = new OpenApiContact
					{
						Name = "Kyoo's github",
						Url = new Uri("https://github.com/AnonymusRaccoon/Kyoo/issues/new/choose")
					},
					License = new OpenApiLicense
					{
						Name = "GPL-3.0-or-later",
						Url = new Uri("https://github.com/AnonymusRaccoon/Kyoo/blob/master/LICENSE")
					}
				});

				foreach (string documentation in Directory.GetFiles(AppContext.BaseDirectory, "*.xml"))
					options.IncludeXmlComments(documentation);

				options.UseAllOfForInheritance();

				options.DocInclusionPredicate((_, apiDescription) =>
				{
					return apiDescription.ActionDescriptor.EndpointMetadata
						.All(x => x is not AltRouteAttribute && x is not AltHttpGetAttribute);
				});
			});
		}

		/// <inheritdoc />
		public IEnumerable<IStartupAction> ConfigureSteps => new IStartupAction[]
		{
			SA.New<IApplicationBuilder>(app => app.UseSwagger(), SA.Before + 1),
			SA.New<IApplicationBuilder>(app => app.UseSwaggerUI(x =>
			{
				x.SwaggerEndpoint("/swagger/v1/swagger.json", "Kyoo v1");
			}), SA.Before),
			SA.New<IApplicationBuilder>(app => app.UseReDoc(x =>
			{
				x.SpecUrl = "/swagger/v1/swagger.json";
			}), SA.Before)
		};
	}
}
