using System;
using Kyoo.Controllers;
using Kyoo.Tasks;
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
		public Type[] Provides => new[]
		{
			typeof(FileManager),
			typeof(Transcoder),
			typeof(ThumbnailsManager),
			typeof(ProviderManager),
			typeof(TaskManager),
			typeof(LibraryManager),
			typeof(LibraryRepository),
			typeof(LibraryItemRepository),
			typeof(CollectionRepository),
			typeof(ShowRepository),
			typeof(SeasonRepository),
			typeof(EpisodeRepository),
			typeof(TrackRepository),
			typeof(PeopleRepository),
			typeof(StudioRepository),
			typeof(GenreRepository),
			typeof(ProviderRepository),
		};

		/// <inheritdoc />
		public Type[] Requires => new[]
		{
			typeof(DatabaseContext)
		};

        /// <inheritdoc />
        public void Configure(IUnityContainer container)
		{
			container.RegisterType<IFileManager, FileManager>(new SingletonLifetimeManager());
			container.RegisterType<ITranscoder, Transcoder>(new SingletonLifetimeManager());
			container.RegisterType<IThumbnailsManager, ThumbnailsManager>(new SingletonLifetimeManager());
			container.RegisterType<IProviderManager, ProviderManager>(new SingletonLifetimeManager());
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