using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Kyoo.Controllers
{
	public class TLibraryManager : LibraryManager
	{
		private readonly DbContext _database;
		
		public TLibraryManager(ILibraryRepository libraryRepository,
			ILibraryItemRepository libraryItemRepository,
			ICollectionRepository collectionRepository,
			IShowRepository showRepository,
			ISeasonRepository seasonRepository,
			IEpisodeRepository episodeRepository,
			ITrackRepository trackRepository,
			IGenreRepository genreRepository,
			IStudioRepository studioRepository,
			IProviderRepository providerRepository,
			IPeopleRepository peopleRepository,
			DbContext database)
			: base(libraryRepository,
				libraryItemRepository,
				collectionRepository,
				showRepository,
				seasonRepository,
				episodeRepository,
				trackRepository,
				genreRepository,
				studioRepository,
				providerRepository,
				peopleRepository)
		{
			_database = database;
		}
		
		public override Task Load<T, T2>(T obj, Expression<Func<T, T2>> member)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			if (!Utility.IsPropertyExpression(member) || member == null)
				throw new ArgumentException($"{nameof(member)} is not a property.");
			
			EntityEntry<T> entry = _database.Entry(obj);
			
			if (!typeof(IEnumerable).IsAssignableFrom(typeof(T2)))
				return entry.Reference(member).LoadAsync();

			Type collectionType = Utility.GetGenericDefinition(typeof(T2), typeof(IEnumerable<>));
			return Utility.RunGenericMethod<CollectionEntry>(entry, "Collection", collectionType, member).LoadAsync();
		}
	}
}