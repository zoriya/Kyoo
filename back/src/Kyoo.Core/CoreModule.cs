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
using AspNetCore.Proxy;
using Autofac;
using Kyoo.Abstractions;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Utils;
using Kyoo.Core.Api;
using Kyoo.Core.Controllers;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using JsonOptions = Kyoo.Core.Api.JsonOptions;

namespace Kyoo.Core
{
	/// <summary>
	/// The core module containing default implementations
	/// </summary>
	public class CoreModule : IPlugin
	{
		/// <summary>
		/// A service provider to access services in static context (in events for example).
		/// </summary>
		/// <remarks>Don't forget to create a scope.</remarks>
		public static IServiceProvider Services { get; set; }

		/// <inheritdoc />
		public string Name => "Core";

		/// <inheritdoc />
		public void Configure(ContainerBuilder builder)
		{
			builder
				.RegisterType<ThumbnailsManager>()
				.As<IThumbnailsManager>()
				.InstancePerLifetimeScope();
			builder.RegisterType<LibraryManager>().As<ILibraryManager>().InstancePerLifetimeScope();

			builder.RegisterRepository<LibraryItemRepository>();
			builder.RegisterRepository<CollectionRepository>();
			builder.RegisterRepository<MovieRepository>();
			builder.RegisterRepository<ShowRepository>();
			builder.RegisterRepository<SeasonRepository>();
			builder.RegisterRepository<EpisodeRepository>();
			builder.RegisterRepository<PeopleRepository>();
			builder.RegisterRepository<StudioRepository>();
			builder.RegisterRepository<UserRepository>();
			builder.RegisterRepository<NewsRepository>();
			builder
				.RegisterType<WatchStatusRepository>()
				.As<IWatchStatusRepository>()
				.AsSelf()
				.InstancePerLifetimeScope();
			builder
				.RegisterType<IssueRepository>()
				.As<IIssueRepository>()
				.AsSelf()
				.InstancePerLifetimeScope();
			builder.RegisterType<SqlVariableContext>().InstancePerLifetimeScope();
		}

		/// <inheritdoc />
		public void Configure(IServiceCollection services)
		{
			services.AddHttpContextAccessor();
			services.AddTransient<IConfigureOptions<MvcNewtonsoftJsonOptions>, JsonOptions>();

			services
				.AddMvcCore(options =>
				{
					options.Filters.Add<ExceptionFilter>();
					options.ModelBinderProviders.Insert(0, new SortBinder.Provider());
					options.ModelBinderProviders.Insert(0, new IncludeBinder.Provider());
					options.ModelBinderProviders.Insert(0, new FilterBinder.Provider());
				})
				.AddNewtonsoftJson(x =>
				{
					x.SerializerSettings.DateTimeZoneHandling = DateTimeZoneHandling.Utc;
					x.SerializerSettings.Converters.Add(new StringEnumConverter());
				})
				.AddDataAnnotations()
				.AddControllersAsServices()
				.AddApiExplorer()
				.ConfigureApiBehaviorOptions(options =>
				{
					options.SuppressMapClientErrors = true;
					options.InvalidModelStateResponseFactory = ctx =>
					{
						string[] errors = ctx
							.ModelState.SelectMany(x => x.Value!.Errors)
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

			services.AddProxies();
			services.AddHttpClient();
		}

		/// <inheritdoc />
		public IEnumerable<IStartupAction> ConfigureSteps =>
			new IStartupAction[]
			{
				SA.New<IApplicationBuilder>(app => app.UseHsts(), SA.Before),
				SA.New<IApplicationBuilder>(app => app.UseResponseCompression(), SA.Routing + 1),
				SA.New<IApplicationBuilder>(app => app.UseRouting(), SA.Routing),
				SA.New<IApplicationBuilder>(
					app => app.UseEndpoints(x => x.MapControllers()),
					SA.Endpoint
				)
			};
	}
}
