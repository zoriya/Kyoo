using Kyoo.Controllers;
using Kyoo.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Unity;
using Unity.Lifetime;

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
		public string[] Provides => new[]
		{
			$"{nameof(IFileManager)}:file",
			$"{nameof(ITranscoder)}:{nameof(Transcoder)}",
			$"{nameof(IThumbnailsManager)}:{nameof(ThumbnailsManager)}",
			$"{nameof(IProviderManager)}:{nameof(ProviderManager)}",
			$"{nameof(IPluginManager)}:{nameof(PluginManager)}",
			$"{nameof(ITaskManager)}:{nameof(TaskManager)}",
			$"{nameof(ILibraryManager)}:{nameof(LibraryManager)}",
			$"{nameof(ILibraryRepository)}:{nameof(LibraryRepository)}",
			$"{nameof(ILibraryItemRepository)}:{nameof(LibraryItemRepository)}",
			$"{nameof(ICollectionRepository)}:{nameof(CollectionRepository)}",
			$"{nameof(IShowRepository)}:{nameof(ShowRepository)}",
			$"{nameof(ISeasonRepository)}:{nameof(SeasonRepository)}",
			$"{nameof(IEpisodeRepository)}:{nameof(EpisodeRepository)}",
			$"{nameof(ITrackRepository)}:{nameof(TrackRepository)}",
			$"{nameof(IPeopleRepository)}:{nameof(PeopleRepository)}",
			$"{nameof(IStudioRepository)}:{nameof(StudioRepository)}",
			$"{nameof(IGenreRepository)}:{nameof(GenreRepository)}",
			$"{nameof(IProviderRepository)}:{nameof(ProviderRepository)}"
		};

		/// <inheritdoc />
		public string[] Requires => new[]
		{
			"DatabaseContext:"
		};

        /// <inheritdoc />
        public void Configure(IUnityContainer container, IConfiguration config, IApplicationBuilder app, bool debugMode)
		{
			container.RegisterType<IFileManager, FileManager>(new SingletonLifetimeManager());
			container.RegisterType<ITranscoder, Transcoder>(new SingletonLifetimeManager());
			container.RegisterType<IThumbnailsManager, ThumbnailsManager>(new SingletonLifetimeManager());
			container.RegisterType<IProviderManager, ProviderManager>(new SingletonLifetimeManager());
			container.RegisterType<IPluginManager, PluginManager>(new SingletonLifetimeManager());
			container.RegisterType<ITaskManager, TaskManager>(new SingletonLifetimeManager());
			
			container.RegisterType<ILibraryManager, LibraryManager>(new HierarchicalLifetimeManager());
			
			container.RegisterType<ILibraryRepository, LibraryRepository>(new HierarchicalLifetimeManager());
			container.RegisterType<ILibraryItemRepository, LibraryItemRepository>(new HierarchicalLifetimeManager());
			container.RegisterType<ICollectionRepository, CollectionRepository>(new HierarchicalLifetimeManager());
			container.RegisterType<IShowRepository, ShowRepository>(new HierarchicalLifetimeManager());
			container.RegisterType<ISeasonRepository, SeasonRepository>(new HierarchicalLifetimeManager());
			container.RegisterType<IEpisodeRepository, EpisodeRepository>(new HierarchicalLifetimeManager());
			container.RegisterType<ITrackRepository, TrackRepository>(new HierarchicalLifetimeManager());
			container.RegisterType<IPeopleRepository, PeopleRepository>(new HierarchicalLifetimeManager());
			container.RegisterType<IStudioRepository, StudioRepository>(new HierarchicalLifetimeManager());
			container.RegisterType<IGenreRepository, GenreRepository>(new HierarchicalLifetimeManager());
			container.RegisterType<IProviderRepository, ProviderRepository>(new HierarchicalLifetimeManager());
			
			container.RegisterTask<Crawler>();
		}
	}
}