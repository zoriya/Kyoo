using System;
using System.Collections.Generic;
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
			(typeof(IProviderRepository), typeof(DatabaseContext))
		};

		/// <inheritdoc />
		public ICollection<Type> Requires => ArraySegment<Type>.Empty;

		/// <inheritdoc />
        public void Configure(IUnityContainer container, ICollection<Type> availableTypes)
		{
			container.RegisterType<IFileManager, FileManager>(new SingletonLifetimeManager());
			container.RegisterType<ITranscoder, Transcoder>(new SingletonLifetimeManager());
			container.RegisterType<IThumbnailsManager, ThumbnailsManager>(new SingletonLifetimeManager());
			container.RegisterType<IProviderManager, ProviderManager>(new SingletonLifetimeManager());
			container.RegisterType<ITaskManager, TaskManager>(new SingletonLifetimeManager());
			
			container.RegisterType<ILibraryManager, LibraryManager>(new HierarchicalLifetimeManager());

			if (ProviderCondition.Has(typeof(DatabaseContext), availableTypes))
			{
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
			}

			container.RegisterTask<Crawler>();
		}
	}
}