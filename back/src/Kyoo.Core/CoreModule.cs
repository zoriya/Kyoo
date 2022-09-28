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
using Autofac;
using Autofac.Core;
using Autofac.Core.Registration;
using Kyoo.Abstractions;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Core.Controllers;
using Kyoo.Core.Models.Options;
using Kyoo.Core.Tasks;
using Kyoo.Database;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using IMetadataProvider = Kyoo.Abstractions.Controllers.IMetadataProvider;
using JsonOptions = Kyoo.Core.Api.JsonOptions;

namespace Kyoo.Core
{
	/// <summary>
	/// The core module containing default implementations
	/// </summary>
	public class CoreModule : IPlugin
	{
		/// <inheritdoc />
		public string Slug => "core";

		/// <inheritdoc />
		public string Name => "Core";

		/// <inheritdoc />
		public string Description => "The core module containing default implementations.";

		/// <inheritdoc />
		public Dictionary<string, Type> Configuration => new()
		{
			{ TaskOptions.Path, typeof(TaskOptions) },
			{ MediaOptions.Path, typeof(MediaOptions) },
			{ "database", null },
			{ "logging", null }
		};

		/// <inheritdoc />
		public void Configure(ContainerBuilder builder)
		{
			builder.RegisterType<LocalFileSystem>().As<IFileSystem>().SingleInstance();
			builder.RegisterType<HttpFileSystem>().As<IFileSystem>().SingleInstance();

			builder.RegisterType<ConfigurationManager>().As<IConfigurationManager>().SingleInstance();
			builder.RegisterType<Transcoder>().As<ITranscoder>().SingleInstance();
			builder.RegisterType<ThumbnailsManager>().As<IThumbnailsManager>().InstancePerLifetimeScope();
			builder.RegisterType<LibraryManager>().As<ILibraryManager>().InstancePerLifetimeScope();
			builder.RegisterType<RegexIdentifier>().As<IIdentifier>().SingleInstance();

			builder.RegisterComposite<ProviderComposite, IMetadataProvider>();
			builder.Register(x => (AProviderComposite)x.Resolve<IMetadataProvider>());

			builder.RegisterTask<Crawler>();
			builder.RegisterTask<Housekeeping>();
			builder.RegisterTask<RegisterEpisode>();
			builder.RegisterTask<RegisterSubtitle>();
			builder.RegisterTask<MetadataProviderLoader>();

			static bool DatabaseIsPresent(IComponentRegistryBuilder x)
				=> x.IsRegistered(new TypedService(typeof(DatabaseContext)));

			builder.RegisterRepository<ILibraryRepository, LibraryRepository>().OnlyIf(DatabaseIsPresent);
			builder.RegisterRepository<ILibraryItemRepository, LibraryItemRepository>().OnlyIf(DatabaseIsPresent);
			builder.RegisterRepository<ICollectionRepository, CollectionRepository>().OnlyIf(DatabaseIsPresent);
			builder.RegisterRepository<IShowRepository, ShowRepository>().OnlyIf(DatabaseIsPresent);
			builder.RegisterRepository<ISeasonRepository, SeasonRepository>().OnlyIf(DatabaseIsPresent);
			builder.RegisterRepository<IEpisodeRepository, EpisodeRepository>().OnlyIf(DatabaseIsPresent);
			builder.RegisterRepository<ITrackRepository, TrackRepository>().OnlyIf(DatabaseIsPresent);
			builder.RegisterRepository<IPeopleRepository, PeopleRepository>().OnlyIf(DatabaseIsPresent);
			builder.RegisterRepository<IStudioRepository, StudioRepository>().OnlyIf(DatabaseIsPresent);
			builder.RegisterRepository<IGenreRepository, GenreRepository>().OnlyIf(DatabaseIsPresent);
			builder.RegisterRepository<IProviderRepository, ProviderRepository>().OnlyIf(DatabaseIsPresent);
			builder.RegisterRepository<IUserRepository, UserRepository>().OnlyIf(DatabaseIsPresent);

			builder.RegisterType<PassthroughPermissionValidator>().As<IPermissionValidator>()
				.IfNotRegistered(typeof(IPermissionValidator));

			builder.RegisterType<FileExtensionContentTypeProvider>().As<IContentTypeProvider>().SingleInstance()
				.OnActivating(x =>
				{
					x.Instance.Mappings[".data"] = "application/octet-stream";
					x.Instance.Mappings[".mkv"] = "video/x-matroska";
					x.Instance.Mappings[".ass"] = "text/x-ssa";
					x.Instance.Mappings[".srt"] = "application/x-subrip";
					x.Instance.Mappings[".m3u8"] = "application/x-mpegurl";
				});
		}

		/// <inheritdoc />
		public void Configure(IServiceCollection services)
		{
			services.AddHttpContextAccessor();
			services.AddTransient<IConfigureOptions<MvcNewtonsoftJsonOptions>, JsonOptions>();

			services.AddMvcCore()
				.AddNewtonsoftJson()
				.AddDataAnnotations()
				.AddControllersAsServices()
				.AddApiExplorer()
				.ConfigureApiBehaviorOptions(options =>
				{
					options.SuppressMapClientErrors = true;
					options.InvalidModelStateResponseFactory = ctx =>
					{
						string[] errors = ctx.ModelState
							.SelectMany(x => x.Value.Errors)
							.Select(x => x.ErrorMessage)
							.ToArray();
						return new BadRequestObjectResult(new RequestError(errors));
					};
				});

			services.Configure<RouteOptions>(x =>
			{
				x.ConstraintMap.Add("id", typeof(IdentifierRouteConstraint));
			});

			services.AddResponseCompression(x =>
			{
				x.EnableForHttps = true;
			});

			services.AddHttpClient();
		}

		/// <inheritdoc />
		public IEnumerable<IStartupAction> ConfigureSteps => new IStartupAction[]
		{
			SA.New<IApplicationBuilder, IHostEnvironment>((app, env) =>
			{
				if (env.IsDevelopment())
					app.UseDeveloperExceptionPage();
				else
				{
					app.UseExceptionHandler("/error");
					app.UseHsts();
				}
			}, SA.Before),
			SA.New<IApplicationBuilder>(app => app.UseResponseCompression(), SA.Routing + 1),
			SA.New<IApplicationBuilder>(app => app.UseRouting(), SA.Routing),
			SA.New<IApplicationBuilder>(app => app.UseEndpoints(x => x.MapControllers()), SA.Endpoint)
		};
	}
}
