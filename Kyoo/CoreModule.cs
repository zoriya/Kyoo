using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Kyoo.Controllers;
using Kyoo.Models.Options;
using Kyoo.Models.Permissions;
using Kyoo.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;

namespace Kyoo
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
		public ICollection<Type> Provides => new[]
		{
			typeof(IFileManager),
			typeof(ITranscoder),
			typeof(IThumbnailsManager),
			typeof(IProviderManager),
			typeof(ITaskManager),
			typeof(ILibraryManager)
		};

		/// <inheritdoc />
		public ICollection<ConditionalProvide> ConditionalProvides => new ConditionalProvide[]
		{
			(typeof(ILibraryRepository), typeof(DatabaseContext)),
			(typeof(ILibraryItemRepository), typeof(DatabaseContext)),
			(typeof(ICollectionRepository), typeof(DatabaseContext)),
			(typeof(IShowRepository), typeof(DatabaseContext)),
			(typeof(ISeasonRepository), typeof(DatabaseContext)),
			(typeof(IEpisodeRepository), typeof(DatabaseContext)),
			(typeof(ITrackRepository), typeof(DatabaseContext)),
			(typeof(IPeopleRepository), typeof(DatabaseContext)),
			(typeof(IStudioRepository), typeof(DatabaseContext)),
			(typeof(IGenreRepository), typeof(DatabaseContext)),
			(typeof(IProviderRepository), typeof(DatabaseContext)),
			(typeof(IUserRepository), typeof(DatabaseContext))
		};

		/// <inheritdoc />
		public ICollection<Type> Requires => new []
		{
			typeof(ILibraryRepository),
			typeof(ILibraryItemRepository),
			typeof(ICollectionRepository),
			typeof(IShowRepository),
			typeof(ISeasonRepository),
			typeof(IEpisodeRepository),
			typeof(ITrackRepository),
			typeof(IPeopleRepository),
			typeof(IStudioRepository),
			typeof(IGenreRepository),
			typeof(IProviderRepository)
		};

		
		/// <summary>
		/// The configuration to use.
		/// </summary>
		private readonly IConfiguration _configuration;

		
		/// <summary>
		/// Create a new core module instance and use the given configuration.
		/// </summary>
		/// <param name="configuration">The configuration to use</param>
		public CoreModule(IConfiguration configuration)
		{
			_configuration = configuration;
		}

		/// <inheritdoc />
        public void Configure(IServiceCollection services, ICollection<Type> availableTypes)
		{
			string publicUrl = _configuration.GetPublicUrl();

			services.Configure<BasicOptions>(_configuration.GetSection(BasicOptions.Path));
			services.AddConfiguration<BasicOptions>(BasicOptions.Path);
			services.Configure<TaskOptions>(_configuration.GetSection(TaskOptions.Path));
			services.AddConfiguration<TaskOptions>(TaskOptions.Path);
			services.Configure<MediaOptions>(_configuration.GetSection(MediaOptions.Path));
			services.AddConfiguration<MediaOptions>(MediaOptions.Path);
			
			services.AddControllers()
				.AddNewtonsoftJson(x =>
				{
					x.SerializerSettings.ContractResolver = new JsonPropertyIgnorer(publicUrl);
					x.SerializerSettings.Converters.Add(new PeopleRoleConverter());
				});
			
			services.AddSingleton<IConfigurationManager, ConfigurationManager>();
			services.AddSingleton<IFileManager, FileManager>();
			services.AddSingleton<ITranscoder, Transcoder>();
			services.AddSingleton<IThumbnailsManager, ThumbnailsManager>();
			services.AddSingleton<IProviderManager, ProviderManager>();
			services.AddSingleton<ITaskManager, TaskManager>();
			services.AddHostedService(x => x.GetService<ITaskManager>() as TaskManager);
			
			services.AddScoped<ILibraryManager, LibraryManager>();

			if (ProviderCondition.Has(typeof(DatabaseContext), availableTypes))
			{
				services.AddRepository<ILibraryRepository, LibraryRepository>();
				services.AddRepository<ILibraryItemRepository, LibraryItemRepository>();
				services.AddRepository<ICollectionRepository, CollectionRepository>();
				services.AddRepository<IShowRepository, ShowRepository>();
				services.AddRepository<ISeasonRepository, SeasonRepository>();
				services.AddRepository<IEpisodeRepository, EpisodeRepository>();
				services.AddRepository<ITrackRepository, TrackRepository>();
				services.AddRepository<IPeopleRepository, PeopleRepository>();
				services.AddRepository<IStudioRepository, StudioRepository>();
				services.AddRepository<IGenreRepository, GenreRepository>();
				services.AddRepository<IProviderRepository, ProviderRepository>();
				services.AddRepository<IUserRepository, UserRepository>();
			}

			services.AddTask<Crawler>();

			if (services.All(x => x.ServiceType != typeof(IPermissionValidator)))
				services.AddSingleton<IPermissionValidator, PassthroughPermissionValidator>();
		}

		/// <inheritdoc />
		public void ConfigureAspNet(IApplicationBuilder app)
		{
			FileExtensionContentTypeProvider contentTypeProvider = new();
			contentTypeProvider.Mappings[".data"] = "application/octet-stream";
			app.UseStaticFiles(new StaticFileOptions
			{
				ContentTypeProvider = contentTypeProvider,
				FileProvider = new PhysicalFileProvider(Path.Join(AppDomain.CurrentDomain.BaseDirectory, "wwwroot"))
			});
			
			app.UseEndpoints(endpoints =>
			{
				endpoints.MapControllers();
			});
		}
	}
}