using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models.Watch;

namespace Kyoo.Models
{
	public class WatchItem
	{
		[JsonIgnore] public readonly int EpisodeID = -1;

		public string ShowTitle;
		public string ShowSlug;
		public int SeasonNumber;
		public int EpisodeNumber;
		public string Title;
		public string Slug;
		public DateTime? ReleaseDate;
		[JsonIgnore] public string Path;
		public Episode PreviousEpisode;
		public Episode NextEpisode;
		public bool IsMovie;

		public string Container;
		public Track Video;
		public IEnumerable<Track> Audios;
		public IEnumerable<Track> Subtitles;

		public WatchItem() { }

		public WatchItem(int episodeID, 
			string showTitle,
			string showSlug,
			int seasonNumber,
			int episodeNumber,
			string title, 
			DateTime? releaseDate,
			string path)
		{
			EpisodeID = episodeID;
			ShowTitle = showTitle;
			ShowSlug = showSlug;
			SeasonNumber = seasonNumber;
			EpisodeNumber = episodeNumber;
			Title = title;
			ReleaseDate = releaseDate;
			Path = path;

			Container = Path.Substring(Path.LastIndexOf('.') + 1);
			Slug = Episode.GetSlug(ShowSlug, seasonNumber, episodeNumber);
		}

		public WatchItem(int episodeID,
			string showTitle,
			string showSlug, 
			int seasonNumber, 
			int episodeNumber, 
			string title, 
			DateTime? releaseDate, 
			string path, 
			Track video,
			IEnumerable<Track> audios,
			IEnumerable<Track> subtitles)
			: this(episodeID, showTitle, showSlug, seasonNumber, episodeNumber, title, releaseDate, path)
		{
			Video = video;
			Audios = audios;
			Subtitles = subtitles;
		}

		public static async Task<WatchItem> FromEpisode(Episode ep, ILibraryManager library)
		{
			Show show = await library.GetShow(ep.ShowID); // TODO load only the title, the slug & the IsMovie with the library manager.
			Episode previous = null;
			Episode next = null;

			if (!show.IsMovie)
			{
				if (ep.EpisodeNumber > 1)
					previous = await library.GetEpisode(ep.ShowID, ep.SeasonNumber, ep.EpisodeNumber - 1);
				else if (ep.SeasonNumber > 1)
				{
					int count = await library.GetEpisodesCount(x => x.ShowID == ep.ShowID 
					                                                && x.SeasonNumber == ep.SeasonNumber - 1);
					previous = await library.GetEpisode(ep.ShowID, ep.SeasonNumber - 1, count);
				}

				if (ep.EpisodeNumber >= await library.GetEpisodesCount(x => x.SeasonID == ep.SeasonID))
					next = await library.GetEpisode(ep.ShowID, ep.SeasonNumber + 1, 1);
				else
					next = await library.GetEpisode(ep.ShowID, ep.SeasonNumber, ep.EpisodeNumber + 1);
			}
			
			return new WatchItem(ep.ID,
				show.Title,
				show.Slug,
				ep.SeasonNumber,
				ep.EpisodeNumber,
				ep.Title,
				ep.ReleaseDate,
				ep.Path,
				await library.GetTrack(x => x.EpisodeID == ep.ID && x.Type == StreamType.Video),
				await library.GetTracks(x => x.EpisodeID == ep.ID && x.Type == StreamType.Audio),
				await library.GetTracks(x => x.EpisodeID == ep.ID && x.Type == StreamType.Subtitle))
			{
				IsMovie = show.IsMovie,
				PreviousEpisode = previous,
				NextEpisode = next
			};
		}
	}
}
