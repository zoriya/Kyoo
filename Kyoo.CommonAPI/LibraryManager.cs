using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Kyoo.Controllers
{
	public class LibraryManager : ALibraryManager
	{
		private readonly DbContext _database;
		
		public LibraryManager(ILibraryRepository libraryRepository,
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

			// TODO This is totally the wrong thing. We should run entry.Collection<T>(collectionMember).LoadAsync()
			// TODO where collectionMember would be member with T2 replaced by it's inner type (IEnumerable<T3>)
			Type collectionType = Utility.GetGenericDefinition(typeof(T2), typeof(IEnumerable<>));
			return Utility.RunGenericMethod<CollectionEntry>(entry, "Collection", collectionType, member).LoadAsync();
		}
	}
}