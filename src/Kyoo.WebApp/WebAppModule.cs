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
using System.Runtime.CompilerServices;
using Kyoo.Abstractions.Controllers;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Kyoo.WebApp
{
	/// <summary>
	/// A module to enable the web-app (the front-end of kyoo).
	/// </summary>
	public class WebAppModule : IPlugin
	{
		/// <inheritdoc />
		public string Slug => "webapp";

		/// <inheritdoc />
		public string Name => "WebApp";

		/// <inheritdoc />
		public string Description => "A module to enable the web-app (the front-end of kyoo).";

		/// <inheritdoc />
		public Dictionary<string, Type> Configuration => new();

		/// <inheritdoc />
		public bool Enabled => false; // Directory.Exists(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "wwwroot"));

		/// <summary>
		/// Create a new <see cref="WebAppModule"/>.
		/// </summary>
		/// <param name="logger">A logger only used to inform the user if the webapp could not be enabled.</param>
		public WebAppModule(ILogger<WebAppModule> logger)
		{
			if (!Enabled)
				logger.LogError("The web app files could not be found, it will be disabled");
		}

		/// <inheritdoc />
		public void Configure(IServiceCollection services)
		{
			services.AddSpaStaticFiles(x =>
			{
				x.RootPath = Path.Join(AppDomain.CurrentDomain.BaseDirectory, "wwwroot");
			});
		}

		/// <inheritdoc />
		public IEnumerable<IStartupAction> ConfigureSteps => new IStartupAction[]
		{
			SA.New<IApplicationBuilder, IWebHostEnvironment>((app, env) =>
			{
				if (!env.IsDevelopment())
					app.UseSpaStaticFiles();
			}, SA.StaticFiles),
			SA.New<IApplicationBuilder, IContentTypeProvider>((app, contentTypeProvider) =>
			{
				app.UseStaticFiles(new StaticFileOptions
				{
					ContentTypeProvider = contentTypeProvider,
					FileProvider = new PhysicalFileProvider(Path.Join(AppDomain.CurrentDomain.BaseDirectory, "wwwroot"))
				});
			}, SA.StaticFiles),
			SA.New<IApplicationBuilder>(app =>
			{
				app.Use((ctx, next) =>
				{
					ctx.Response.Headers.Remove("X-Powered-By");
					ctx.Response.Headers.Remove("Server");
					ctx.Response.Headers.Add("Feature-Policy", "autoplay 'self'; fullscreen");
					ctx.Response.Headers.Add("Content-Security-Policy", "default-src 'self' blob:; script-src 'self' blob: 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; frame-src 'self'");
					ctx.Response.Headers.Add("X-Frame-Options", "SAMEORIGIN");
					ctx.Response.Headers.Add("Referrer-Policy", "no-referrer");
					ctx.Response.Headers.Add("Access-Control-Allow-Origin", "null");
					ctx.Response.Headers.Add("X-Content-Type-Options", "nosniff");
					return next();
				});
			}, SA.Endpoint - 499),
			SA.New<IApplicationBuilder, IWebHostEnvironment>((app, env) =>
			{
				app.UseSpa(spa =>
				{
					spa.Options.SourcePath = _GetSpaSourcePath();

					if (env.IsDevelopment())
						spa.UseAngularCliServer("start");
				});
			}, SA.Endpoint - 500)
		};

		/// <summary>
		/// Get the root directory of the web app
		/// </summary>
		/// <returns>The path of the source code of the web app or null if the directory has been deleted.</returns>
		private static string _GetSpaSourcePath()
		{
			static string GetRepoRootPath([CallerFilePath] string path = null)
			{
				// path is {RepoRoot}/src/Kyoo.WebApp/WebAppModules.cs
				for (int i = 0; i < 3; i++)
					path = Path.GetDirectoryName(path);
				return path;
			}

			string path = Path.Join(GetRepoRootPath(), "front");
			return Directory.Exists(path) ? path : null;
		}
	}
}
