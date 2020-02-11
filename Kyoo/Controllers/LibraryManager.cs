using Kyoo.Models;
using Kyoo.Models.Watch;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class LibraryManager : ILibraryManager
	{
		private readonly DatabaseContext _database;
		
		
		public LibraryManager(DatabaseContext database)
		{
			_database = database;
		}

		#region Read the database
		public IEnumerable<Library> GetLibraries()
		{
			return _database.Libraries;
		}

		public IEnumerable<string> GetLibrariesPath()
		{
			IEnumerable<string> paths = new List<string>();
			return Enumerable.Aggregate(_database.Libraries, paths, (current, lib) => current.Concat(lib.Paths));
		}

		public string GetShowExternalIDs(long showID)
		{
			return (from show in _database.Shows where show.ID == showID select show.ExternalIDs).FirstOrDefault();
		}


		public (Track video, IEnumerable<Track> audios, IEnumerable<Track> subtitles) GetStreams(long episodeID, string episodeSlug)
		{
			IEnumerable<Track> tracks = _database.Tracks.Where(track => track.EpisodeID == episodeID);
			return ((from track in tracks where track.Type == StreamType.Video select track.SetLink(episodeSlug)).FirstOrDefault(),
				from track in tracks where track.Type == StreamType.Audio select track.SetLink(episodeSlug),
				from track in tracks where track.Type == StreamType.Subtitle select track.SetLink(episodeSlug));
		}

		public Track GetSubtitle(string showSlug, long seasonNumber, long episodeNumber, string languageTag, bool forced)
		{
			long? showID = _database.Shows.FirstOrDefault(x => x.Slug == showSlug)?.ID;
			if (showID == null)
				return null;
			return (from track in _database.Tracks where track.Episode.ShowID == showID 
			                                          && track.Episode.SeasonNumber == seasonNumber 
			                                          && track.Episode.EpisodeNumber == episodeNumber
			                                          && track.Language == languageTag select track).FirstOrDefault();
		}


		public Library GetLibrary(string librarySlug)
		{
			return (from library in _database.Libraries where library.Slug == librarySlug select library).FirstOrDefault();
		}

		public IEnumerable<Show> GetShows()
		{
			return (from show in _database.Shows from l in _database.CollectionLinks.DefaultIfEmpty()
				where l.CollectionID == null select show).AsEnumerable().Union(
				from collection in _database.Collections select collection.AsShow()).OrderBy(x => x.Title);
		}

		public IEnumerable<Show> GetShows(string searchQuery)
		{
			return (from show in _database.Shows from l in _database.CollectionLinks.DefaultIfEmpty()
					where l.CollectionID == null select show).AsEnumerable().Union(
					from collection in _database.Collections select collection.AsShow())
				.Where(x => EF.Functions.Like(x.Title, $"%{searchQuery}%") 
				            || EF.Functions.Like(x.GetAliases(), $"%{searchQuery}%"))
				.Take(20).OrderBy(x => x.Title);
		}

		public Show GetShowBySlug(string slug)
		{
			Show ret = (from show in _database.Shows where show.Slug == slug select show).FirstOrDefault();
			if (ret != null)
				ret.Seasons = ret.Seasons.OrderBy(x => x.SeasonNumber);
			return ret;
		}
		
		public Show GetShow(string path)
		{
			return (from show in _database.Shows where show.Path == path select show).FirstOrDefault();
		}

		public IEnumerable<Season> GetSeasons(long showID)
		{
			return (from season in _database.Seasons where season.ShowID == showID select season)
				.OrderBy(x => x.SeasonNumber);
		}

		public Season GetSeason(string showSlug, long seasonNumber)
		{
			return (from season in _database.Seasons
				where season.SeasonNumber == seasonNumber
				      && season.Show.Slug == showSlug
				select season).FirstOrDefault();
		}

		public int GetSeasonCount(string showSlug, long seasonNumber)
		{
			return (from season in _database.Seasons
				where season.SeasonNumber == seasonNumber
				      && season.Show.Slug == showSlug
				select season).FirstOrDefault()?.Episodes.Count() ?? 0;
		}

		public IEnumerable<Episode> GetEpisodes(string showSlug)
		{
			return from episode in _database.Episodes where episode.Show.Slug == showSlug select episode.SetLink(showSlug);
		}

		public IEnumerable<Episode> GetEpisodes(string showSlug, long seasonNumber)
		{
			return (from episode in _database.Episodes where episode.SeasonNumber == seasonNumber 
			                                             && episode.Show.Slug == showSlug select episode)
				.OrderBy(x => x.EpisodeNumber)
				.Select(x => x.SetLink(showSlug));
		}

		public IEnumerable<Episode> GetEpisodes(long showID, long seasonNumber)
		{
			return from episode in _database.Episodes where episode.ShowID == showID 
			                                             && episode.SeasonNumber == seasonNumber select episode.SetLink(episode.Show.Slug);
		}

		public Episode GetEpisode(string showSlug, long seasonNumber, long episodeNumber)
		{
			return (from episode in _database.Episodes where episode.EpisodeNumber == episodeNumber
															&& episode.SeasonNumber == seasonNumber 
			                                                && episode.Show.Slug == showSlug select episode.SetLink(showSlug)).FirstOrDefault();
		}

		public WatchItem GetWatchItem(string showSlug, long seasonNumber, long episodeNumber, bool complete = true)
		{
			WatchItem item = (from episode in _database.Episodes where episode.SeasonNumber == seasonNumber 
               && episode.EpisodeNumber == episodeNumber && episode.Show.Slug == showSlug 
				select new WatchItem(episode.ID, 
					episode.Show.Title,
					episode.Show.Slug,
					seasonNumber,
					episodeNumber,
					episode.Title,
					episode.ReleaseDate,
					episode.Path)).FirstOrDefault();
			if (item == null)
				return null;
			
			(item.Video, item.Audios, item.Subtitles) = GetStreams(item.EpisodeID, item.Link);
			if(episodeNumber > 1)
				item.PreviousEpisode = showSlug + "-s" + seasonNumber + "e" + (episodeNumber - 1);
			else if(seasonNumber > 1)
				item.PreviousEpisode = showSlug + "-s" + (seasonNumber - 1) + "e" + GetSeasonCount(showSlug, seasonNumber - 1);
			
			if (episodeNumber >= GetSeasonCount(showSlug, seasonNumber))
				item.NextEpisode = GetEpisode(showSlug, seasonNumber + 1, 1);
			else
				item.NextEpisode = GetEpisode(showSlug, seasonNumber, episodeNumber + 1);
			return item;
		}

		public IEnumerable<PeopleLink> GetPeople(long showID)
		{
			return from link in _database.PeopleLinks where link.ShowID == showID select link;
		}

		public People GetPeopleBySlug(string slug)
		{
			return (from people in _database.Peoples where people.Slug == slug select people).FirstOrDefault();
		}

		public IEnumerable<Genre> GetGenreForShow(long showID)
		{
			return ((from show in _database.Shows where show.ID == showID select show.Genres).FirstOrDefault());
		}

		public Genre GetGenreBySlug(string slug)
		{
			return (from genre in _database.Genres where genre.Slug == slug select genre).FirstOrDefault();
		}

		public Studio GetStudio(long showID)
		{
			return (from show in _database.Shows where show.ID == showID select show.Studio).FirstOrDefault();
		}

		public Studio GetStudioBySlug(string slug)
		{
			return (from studio in _database.Studios where studio.Slug == slug select studio).FirstOrDefault();
		}

		public Collection GetCollection(string slug)
		{
			return (from collection in _database.Collections where collection.Slug == slug select collection).FirstOrDefault();
		}

		public IEnumerable<Show> GetShowsInCollection(long collectionID)
		{
			return from link in _database.CollectionLinks where link.CollectionID == collectionID select link.Show;
		}

		public IEnumerable<Show> GetShowsInLibrary(long libraryID)
		{
			return (from link in _database.LibraryLinks where link.LibraryID == libraryID select link)
				.AsEnumerable()
				.Select(link =>
				{
					_database.Entry(link).Reference(l => l.Show).Load();
					_database.Entry(link).Reference(l => l.Collection).Load();
					return link.Show ?? link.Collection.AsShow();
				})
				.OrderBy(x => x.Title);
		}

		public IEnumerable<Show> GetShowsByPeople(long peopleID)
		{
			return (from link in _database.PeopleLinks where link.PeopleID == peopleID select link.Show).OrderBy(x => x.Title);
		}

		public IEnumerable<Episode> GetAllEpisodes()
		{
			return _database.Episodes;
		}

		public IEnumerable<Episode> SearchEpisodes(string searchQuery)
		{
			return (from episode in _database.Episodes where EF.Functions.Like(episode.Title, $"%{searchQuery}%") select episode)
				.Take(20);
		}
		
		public IEnumerable<People> SearchPeople(string searchQuery)
		{
			return (from people in _database.Peoples where EF.Functions.Like(people.Name, $"%{searchQuery}%") select people)
				.Take(20);
		}
		
		public IEnumerable<Genre> SearchGenres(string searchQuery)
		{
			return (from genre in _database.Genres where EF.Functions.Like(genre.Name, $"%{searchQuery}%") select genre)
				.Take(20);
		}
		
		public IEnumerable<Studio> SearchStudios(string searchQuery)
		{
			return (from studio in _database.Studios where EF.Functions.Like(studio.Name, $"%{searchQuery}%") select studio)
				.Take(20);
		}
		#endregion

		#region Check if items exists
		public bool IsCollectionRegistered(string collectionSlug, out long collectionID)
		{
			Collection col = (from collection in _database.Collections where collection.Slug == collectionSlug select collection).FirstOrDefault();
			collectionID = col?.ID ?? -1;
			return collectionID != -1;
		}

		public bool IsShowRegistered(string showPath, out long showID)
		{
			Show tmp = (from show in _database.Shows where show.Path == showPath select show).FirstOrDefault();
			showID = tmp?.ID ?? -1;
			return showID != -1;
		}

		public bool IsSeasonRegistered(long showID, long seasonNumber, out long seasonID)
		{
			Season tmp = (from season in _database.Seasons where season.SeasonNumber == seasonNumber && season.ShowID == showID select season).FirstOrDefault();
			seasonID = tmp?.ID ?? -1;
			return seasonID != -1;
		}

		public bool IsEpisodeRegistered(string episodePath, out long episodeID)
		{
			Episode tmp = (from episode in _database.Episodes where episode.Path == episodePath select episode).FirstOrDefault();
			episodeID = tmp?.ID ?? -1;
			return episodeID != -1;
		}

		public long GetOrCreateGenre(Genre genre)
		{
			Genre existingGenre = GetGenreBySlug(genre.Slug);

			if (existingGenre != null)
				return existingGenre.ID;

			_database.Genres.Add(genre);
			_database.SaveChanges();
			return genre.ID;
		}

		public long GetOrCreateStudio(Studio studio)
		{
			Studio existingStudio = GetStudioBySlug(studio.Slug);

			if (existingStudio != null)
				return existingStudio.ID;
			
			_database.Studios.Add(studio);
			_database.SaveChanges();
			return studio.ID;
		}

		public long GetOrCreatePeople(People people)
		{
			People existingPeople = GetPeopleBySlug(people.Slug);

			if (existingPeople != null)
				return existingPeople.ID;

			_database.Peoples.Add(people);
			_database.SaveChanges();
			return people.ID;
		}
		#endregion

		#region Write Into The Database
		public long RegisterCollection(Collection collection)
		{
			_database.Collections.Add(collection);
			_database.SaveChanges();
			return collection.ID;
		}

		public long RegisterShow(Show show)
		{
			_database.Shows.Add(show);
			_database.SaveChanges();
			return show.ID;
		}

		public long RegisterSeason(Season season)
		{
			_database.Seasons.Add(season);
			_database.SaveChanges();
			return season.ID;
		}

		public long RegisterEpisode(Episode episode)
		{
			_database.Episodes.Add(episode);
			_database.SaveChanges();
			return episode.ID;
		}

		public long RegisterTrack(Track track)
		{
			_database.Tracks.Add(track);
			_database.SaveChanges();
			return track.ID;
		}

		public void RegisterShowLinks(Library library, Collection collection, Show show)
		{
			if (collection != null)
			{
				_database.LibraryLinks.AddIfNotExist(new LibraryLink {LibraryID = library.ID, CollectionID = collection.ID}, x => x.LibraryID == library.ID && x.CollectionID == collection.ID && x.ShowID == null);
				_database.CollectionLinks.AddIfNotExist(new CollectionLink { CollectionID = collection.ID, ShowID = show.ID}, x => x.CollectionID == collection.ID && x.ShowID == show.ID);
			}
			_database.LibraryLinks.AddIfNotExist(new LibraryLink {LibraryID = library.ID, ShowID = show.ID}, x => x.LibraryID == library.ID && x.CollectionID == null && x.ShowID == show.ID);
			_database.SaveChanges();
		}
		
		public void RemoveShow(long showID)
		{
			_database.Shows.Remove(new Show {ID = showID});
		}

		public void RemoveSeason(long seasonID)
		{
			_database.Seasons.Remove(new Season {ID = seasonID});
		}

		public void RemoveEpisode(long episodeID)
		{
			_database.Episodes.Remove(new Episode {ID = episodeID});
		}

		public void ClearSubtitles(long episodeID)
		{
			_database.Tracks.RemoveRange(_database.Tracks.Where(x => x.EpisodeID == episodeID));
		}
		#endregion
	}
}
