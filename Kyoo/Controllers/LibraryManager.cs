using System;
using System.Collections;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Kyoo.Controllers
{
	public class LibraryManager : ALibraryManager
	{
		private readonly DatabaseContext _database;
		
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
			DatabaseContext database)
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
			if (typeof(IEnumerable).IsAssignableFrom(typeof(T2)))
				return _database.Entry(obj).Collection(member).LoadAsync();
			return _database.Entry(obj).Reference(member).LoadAsync();
		}
	}
}