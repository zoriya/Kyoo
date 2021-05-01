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
			typeof(IFileManager),
			typeof(ITranscoder),
			typeof(IThumbnailsManager),
			typeof(IProviderManager),
			typeof(ITaskManager),
			typeof(ILibraryManager),
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

		/// <inheritdoc />
		public Type[] Requires => new[]
		{
			typeof(DatabaseContext)
		};

		/// <inheritdoc />
		public bool IsRequired => true;
		
        /// <inheritdoc />
        public void Configure(IUnityContainer container)
		{
			container.RegisterType<IFileManager, FileManager>(new SingletonLifetimeManager());
			container.RegisterType<ITranscoder, Transcoder>(new SingletonLifetimeManager());
			container.RegisterType<IThumbnailsManager, ThumbnailsManager>(new SingletonLifetimeManager());
			container.RegisterType<IProviderManager, ProviderManager>(new SingletonLifetimeManager());
			container.RegisterType<ITaskManager, TaskManager>(new SingletonLifetimeManager());
			
			container.RegisterType<ILibraryManager, LibraryManager>(new HierarchicalLifetimeManager());
			
			container.RegisterRepository<ILibraryRepository, LibraryRepository>();
			container.RegisterRepository<ILibraryItemRepository, LibraryItemRepository>();
			container.RegisterRepository<ICollectionRepository, CollectionRepository>();
			container.RegisterRepository<IShowRepository, ShowRepository>();
			container.RegisterRepository<ISeasonRepository, SeasonRepository>();
			container.RegisterRepository<IEpisodeRepository, EpisodeRepository>();
			container.RegisterRepository<ITrackRepository, TrackRepository>();
			container.RegisterRepository<IPeopleRepository, PeopleRepository>();
			container.RegisterRepository<IStudioRepository, StudioRepository>();
			container.RegisterRepository<IGenreRepository, GenreRepository>();
			container.RegisterRepository<IProviderRepository, ProviderRepository>();
			
			container.RegisterTask<Crawler>();
		}
	}
}