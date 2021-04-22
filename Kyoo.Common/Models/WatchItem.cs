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
		public int EpisodeID { get; set; }

		public string ShowTitle { get; set; }
		public string ShowSlug { get; set; }
		public int SeasonNumber { get; set; }
		public int EpisodeNumber { get; set; }
		public int AbsoluteNumber { get; set; }
		public string Title { get; set; }
		public string Slug { get; set; }
		public DateTime? ReleaseDate { get; set; }
		[SerializeIgnore] public string Path { get; set; }
		public Episode PreviousEpisode { get; set; }
		public Episode NextEpisode { get; set; }
		public bool IsMovie { get; set; }

		[SerializeAs("{HOST}/api/show/{ShowSlug}/poster")] public string Poster { get; set; }
		[SerializeAs("{HOST}/api/show/{ShowSlug}/logo")] public string Logo { get; set; }
		[SerializeAs("{HOST}/api/show/{ShowSlug}/backdrop")] public string Backdrop { get; set; }

		public string Container { get; set; }
		public Track Video { get; set; }
		public ICollection<Track> Audios { get; set; }
		public ICollection<Track> Subtitles { get; set; }
		public ICollection<Chapter> Chapters { get; set; }

		public WatchItem() { }

		private WatchItem(int episodeID, 
			Show show,
			int seasonNumber,
			int episodeNumber,
			int absoluteNumber,
			string title, 
			DateTime? releaseDate,
			string path)
		{
			EpisodeID = episodeID;
			ShowTitle = show.Title;
			ShowSlug = show.Slug;
			SeasonNumber = seasonNumber;
			EpisodeNumber = episodeNumber;
			AbsoluteNumber = absoluteNumber;
			Title = title;
			ReleaseDate = releaseDate;
			Path = path;
			IsMovie = show.IsMovie;

			Poster = show.Poster;
			Logo = show.Logo;
			Backdrop = show.Backdrop;

			Container = Path.Substring(Path.LastIndexOf('.') + 1);
			Slug = Episode.GetSlug(ShowSlug, seasonNumber, episodeNumber, absoluteNumber);
		}

		private WatchItem(int episodeID,
			Show show,
			int seasonNumber, 
			int episodeNumber,
			int absoluteNumber,
			string title, 
			DateTime? releaseDate, 
			string path, 
			Track video,
			ICollection<Track> audios,
			ICollection<Track> subtitles)
			: this(episodeID, show, seasonNumber, episodeNumber, absoluteNumber, title, releaseDate, path)
		{
			Video = video;
			Audios = audios;
			Subtitles = subtitles;
		}

		public static async Task<WatchItem> FromEpisode(Episode ep, ILibraryManager library)
		{
			Episode previous = null;
			Episode next = null;

			await library.Load(ep, x => x.Show);
			await library.Load(ep, x => x.Tracks);
			
			if (!ep.Show.IsMovie)
			{
				if (ep.EpisodeNumber > 1)
					previous = await library.GetOrDefault(ep.ShowID, ep.SeasonNumber, ep.EpisodeNumber - 1);
				else if (ep.SeasonNumber > 1)
				{
					int count = await library.GetCount<Episode>(x => x.ShowID == ep.ShowID 
					                                                && x.SeasonNumber == ep.SeasonNumber - 1);
					previous = await library.GetOrDefault(ep.ShowID, ep.SeasonNumber - 1, count);
				}

				if (ep.EpisodeNumber >= await library.GetCount<Episode>(x => x.SeasonID == ep.SeasonID))
					next = await library.GetOrDefault(ep.ShowID, ep.SeasonNumber + 1, 1);
				else
					next = await library.GetOrDefault(ep.ShowID, ep.SeasonNumber, ep.EpisodeNumber + 1);
			}
			
			return new WatchItem(ep.ID,
				ep.Show,
				ep.SeasonNumber,
				ep.EpisodeNumber,
				ep.AbsoluteNumber,
				ep.Title,
				ep.ReleaseDate,
				ep.Path,
				ep.Tracks.FirstOrDefault(x => x.Type == StreamType.Video),
				ep.Tracks.Where(x => x.Type == StreamType.Audio).ToArray(),
				ep.Tracks.Where(x => x.Type == StreamType.Subtitle).ToArray())
			{
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
