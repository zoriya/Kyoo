using System;
using System.Collections.Generic;
using System.IO;
using Autofac;
using Autofac.Core;
using Autofac.Core.Registration;
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
			typeof(IMetadataProvider),
			typeof(ITaskManager),
			typeof(ILibraryManager),
			typeof(IIdentifier),
			typeof(AProviderComposite)
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
		public void Configure(ContainerBuilder builder)
		{
			builder.RegisterType<ConfigurationManager>().As<IConfigurationManager>().SingleInstance();
			builder.RegisterType<FileManager>().As<IFileManager>().SingleInstance();
			builder.RegisterType<Transcoder>().As<ITranscoder>().SingleInstance();
			builder.RegisterType<ThumbnailsManager>().As<IThumbnailsManager>().SingleInstance();
			builder.RegisterType<TaskManager>().As<ITaskManager>().SingleInstance();
			builder.RegisterType<LibraryManager>().As<ILibraryManager>().InstancePerLifetimeScope();
			builder.RegisterType<RegexIdentifier>().As<IIdentifier>().SingleInstance();
			builder.RegisterComposite<ProviderComposite, IMetadataProvider>();
			builder.Register(x => (AProviderComposite)x.Resolve<IMetadataProvider>());

			builder.RegisterTask<Crawler>();
			builder.RegisterTask<Housekeeping>();
			builder.RegisterTask<RegisterEpisode>();
			builder.RegisterTask<RegisterSubtitle>();

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
			services.AddUntypedConfiguration("database");
			services.AddUntypedConfiguration("logging");
			
			services.AddControllers()
				.AddNewtonsoftJson(x =>
				{
					x.SerializerSettings.ContractResolver = new JsonPropertyIgnorer(publicUrl);
					x.SerializerSettings.Converters.Add(new PeopleRoleConverter());
				});
			
			services.AddHostedService(x => x.GetService<ITaskManager>() as TaskManager);
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