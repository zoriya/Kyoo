using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models.Attributes;
using PathIO = System.IO.Path;

namespace Kyoo.Models
{
	public class Chapter
	{
		public float StartTime;
		public float EndTime;
		public string Name;

		public Chapter(float startTime, float endTime, string name)
		{
			StartTime = startTime;
			EndTime = endTime;
			Name = name;
		}
	}
	
	public class WatchItem
	{
		public readonly int EpisodeID;

		public string ShowTitle;
		public string ShowSlug;
		public int SeasonNumber;
		public int EpisodeNumber;
		public string Title;
		public string Slug;
		public DateTime? ReleaseDate;
		[SerializeIgnore] public string Path;
		public Episode PreviousEpisode;
		public Episode NextEpisode;
		public bool IsMovie;

		public string Container;
		public Track Video;
		public ICollection<Track> Audios;
		public ICollection<Track> Subtitles;
		public ICollection<Chapter> Chapters;

		public WatchItem() { }

		private WatchItem(int episodeID, 
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

		private WatchItem(int episodeID,
			string showTitle,
			string showSlug, 
			int seasonNumber, 
			int episodeNumber, 
			string title, 
			DateTime? releaseDate, 
			string path, 
			Track video,
			ICollection<Track> audios,
			ICollection<Track> subtitles)
			: this(episodeID, showTitle, showSlug, seasonNumber, episodeNumber, title, releaseDate, path)
		{
			Video = video;
			Audios = audios;
			Subtitles = subtitles;
		}

		public static async Task<WatchItem> FromEpisode(Episode ep, ILibraryManager library)
		{
			Show show = await library.GetShow(ep.ShowID);
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

			await library.Load(ep, x => x.Tracks);
			return new WatchItem(ep.ID,
				show.Title,
				show.Slug,
				ep.SeasonNumber,
				ep.EpisodeNumber,
				ep.Title,
				ep.ReleaseDate,
				ep.Path,
				ep.Tracks.FirstOrDefault(x => x.Type == StreamType.Video),
				ep.Tracks.Where(x => x.Type == StreamType.Audio).ToArray(),
				ep.Tracks.Where(x => x.Type == StreamType.Subtitle).ToArray())
			{
				IsMovie = show.IsMovie,
				PreviousEpisode = previous,
				NextEpisode = next,
				Chapters = await GetChapters(ep.Path)
			};
		}

		private static async Task<ICollection<Chapter>> GetChapters(string episodePath)
		{
			string path = PathIO.Combine(
				PathIO.GetDirectoryName(episodePath)!, 
				"Chapters",
				PathIO.GetFileNameWithoutExtension(episodePath) + ".txt"
			);
			if (!File.Exists(path))
				return Array.Empty<Chapter>();
			try
			{
				return (await File.ReadAllLinesAsync(path))
					.Select(x =>
					{
						string[] values = x.Split(' ');
						return new Chapter(float.Parse(values[0]), float.Parse(values[1]), string.Join(' ', values.Skip(2)));
					})
					.ToArray();
			}
			catch
			{
				await Console.Error.WriteLineAsync($"Invalid chapter file at {path}");
				return Array.Empty<Chapter>();
			}
		}
	}
}
