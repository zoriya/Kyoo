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
using System.Linq;
using Amazon.S3;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Core.Controllers;
using Kyoo.Core.Storage;
using Kyoo.Postgresql;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Core;

public static class CoreModule
{
	/// <summary>
	/// A service provider to access services in static context (in events for example).
	/// </summary>
	/// <remarks>Don't forget to create a scope.</remarks>
	public static IServiceProvider Services { get; set; }

	public static void AddRepository<T, TRepo>(this IServiceCollection services)
		where T : IResource
		where TRepo : class, IRepository<T>
	{
		services.AddScoped<TRepo>();
		services.AddScoped<IRepository<T>>(x => x.GetRequiredService<TRepo>());
		services.AddScoped<Lazy<IRepository<T>>>(x => new(() => x.GetRequiredService<TRepo>()));
	}

	public static void ConfigureKyoo(this WebApplicationBuilder builder)
	{
		builder._AddStorage();

		builder.Services.AddScoped<IThumbnailsManager, ThumbnailsManager>();
		builder.Services.AddScoped<ILibraryManager, LibraryManager>();

		builder.Services.AddRepository<ILibraryItem, LibraryItemRepository>();
		builder.Services.AddRepository<Collection, CollectionRepository>();
		builder.Services.AddRepository<Movie, MovieRepository>();
		builder.Services.AddRepository<Show, ShowRepository>();
		builder.Services.AddRepository<Season, SeasonRepository>();
		builder.Services.AddRepository<Episode, EpisodeRepository>();
		builder.Services.AddRepository<Studio, StudioRepository>();
		builder.Services.AddRepository<INews, NewsRepository>();
		builder.Services.AddRepository<User, UserRepository>();
		builder.Services.AddScoped<IUserRepository>(x => x.GetRequiredService<UserRepository>());
		builder.Services.AddScoped<WatchStatusRepository>();
		builder.Services.AddScoped<IWatchStatusRepository>(x =>
			x.GetRequiredService<WatchStatusRepository>()
		);
		builder.Services.AddScoped<IIssueRepository, IssueRepository>();
		builder.Services.AddScoped<SqlVariableContext>();
		builder.Services.AddScoped<MiscRepository>();
	}

	private static void _AddStorage(this WebApplicationBuilder builder)
	{
		var shouldUseS3 = !string.IsNullOrEmpty(
			builder.Configuration.GetValue<string>(S3Storage.S3BucketEnvironmentVariable)
		);

		if (!shouldUseS3)
		{
			builder.Services.AddScoped<IStorage, FileStorage>();
			return;
		}

		// Configuration (credentials, endpoint, etc.) are done via standard AWS env vars
		builder.Services.AddScoped<IAmazonS3, AmazonS3Client>();
		builder.Services.AddScoped<IStorage, S3Storage>();
	}
}
