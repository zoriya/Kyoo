using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
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
			IEnumerable<Track> audios,
			IEnumerable<Track> subtitles,
			Track video)
			: this(episodeID, showTitle, showSlug, seasonNumber, episodeNumber, title, releaseDate, path)
		{
			Audios = audios;
			Subtitles = subtitles;
			Video = video;
		}

		public WatchItem(Episode episode)
			: this(episode.ID,
				episode.Show.Title,
				episode.Show.Slug,
				episode.SeasonNumber,
				episode.EpisodeNumber,
				episode.Title,
				episode.ReleaseDate,
				episode.Path,
				episode.Tracks.Where(x => x.Type == StreamType.Audio),
				episode.Tracks.Where(x => x.Type == StreamType.Subtitle),
				episode.Tracks.FirstOrDefault(x => x.Type == StreamType.Video))
		{
			if (episode.Show.IsMovie)
			{
				IsMovie = true;
				return;
			}

			if (EpisodeNumber > 1)
				PreviousEpisode = episode.Season.Episodes.FirstOrDefault(x => x.EpisodeNumber == EpisodeNumber - 1);
			else if (SeasonNumber > 1)
			{
				Season previousSeason = episode.Show.Seasons
					.FirstOrDefault(x => x.SeasonNumber == SeasonNumber - 1);
				PreviousEpisode = previousSeason?.Episodes
					.FirstOrDefault(x => x.EpisodeNumber == previousSeason.Episodes.Count());
			}

			if (EpisodeNumber >= episode.Season.Episodes.Count())
			{
				NextEpisode = episode.Show.Seasons
					.FirstOrDefault(x => x.SeasonNumber == SeasonNumber + 1)?.Episodes
					.FirstOrDefault(x => x.EpisodeNumber == 1);
			}
			else
				NextEpisode = episode.Season.Episodes.FirstOrDefault(x => x.EpisodeNumber == EpisodeNumber + 1);
		}
	}
}
