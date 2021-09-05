using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Attributes;
using PathIO = System.IO.Path;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A watch item give information useful for playback.
	/// Information about tracks and display information that could be used by the player.
	/// This contains mostly data from an <see cref="Episode"/> with another form.
	/// </summary>
	public class WatchItem
	{
		/// <summary>
		/// The ID of the episode associated with this item.
		/// </summary>
		public int EpisodeID { get; set; }

		/// <summary>
		/// The slug of this episode.
		/// </summary>
		public string Slug { get; set; }

		/// <summary>
		/// The title of the show containing this episode.
		/// </summary>
		public string ShowTitle { get; set; }

		/// <summary>
		/// The slug of the show containing this episode
		/// </summary>
		public string ShowSlug { get; set; }

		/// <summary>
		/// The season in witch this episode is in.
		/// </summary>
		public int? SeasonNumber { get; set; }

		/// <summary>
		/// The number of this episode is it's season.
		/// </summary>
		public int? EpisodeNumber { get; set; }

		/// <summary>
		/// The absolute number of this episode. It's an episode number that is not reset to 1 after a new season.
		/// </summary>
		public int? AbsoluteNumber { get; set; }

		/// <summary>
		/// The title of this episode.
		/// </summary>
		public string Title { get; set; }

		/// <summary>
		/// The release date of this episode. It can be null if unknown.
		/// </summary>
		public DateTime? ReleaseDate { get; set; }

		/// <summary>
		/// The path of the video file for this episode. Any format supported by a <see cref="IFileSystem"/> is allowed.
		/// </summary>
		[SerializeIgnore] public string Path { get; set; }

		/// <summary>
		/// The episode that come before this one if you follow usual watch orders.
		/// If this is the first episode or this is a movie, it will be null.
		/// </summary>
		public Episode PreviousEpisode { get; set; }

		/// <summary>
		/// The episode that come after this one if you follow usual watch orders.
		/// If this is the last aired episode or this is a movie, it will be null.
		/// </summary>
		public Episode NextEpisode { get; set; }

		/// <summary>
		/// <c>true</c> if this is a movie, <c>false</c> otherwise.
		/// </summary>
		public bool IsMovie { get; set; }

		/// <summary>
		/// The path of this item's poster.
		/// By default, the http path for the poster is returned from the public API.
		/// This can be disabled using the internal query flag.
		/// </summary>
		[SerializeAs("{HOST}/api/show/{ShowSlug}/poster")] public string Poster { get; set; }

		/// <summary>
		/// The path of this item's logo.
		/// By default, the http path for the logo is returned from the public API.
		/// This can be disabled using the internal query flag.
		/// </summary>
		[SerializeAs("{HOST}/api/show/{ShowSlug}/logo")] public string Logo { get; set; }

		/// <summary>
		/// The path of this item's backdrop.
		/// By default, the http path for the backdrop is returned from the public API.
		/// This can be disabled using the internal query flag.
		/// </summary>
		[SerializeAs("{HOST}/api/show/{ShowSlug}/backdrop")] public string Backdrop { get; set; }

		/// <summary>
		/// The container of the video file of this episode.
		/// Common containers are mp4, mkv, avi and so on.
		/// </summary>
		public string Container { get; set; }

		/// <summary>
		/// The video track. See <see cref="Track"/> for more information.
		/// </summary>
		public Track Video { get; set; }

		/// <summary>
		/// The list of audio tracks. See <see cref="Track"/> for more information.
		/// </summary>
		public ICollection<Track> Audios { get; set; }

		/// <summary>
		/// The list of subtitles tracks. See <see cref="Track"/> for more information.
		/// </summary>
		public ICollection<Track> Subtitles { get; set; }

		/// <summary>
		/// The list of chapters. See <see cref="Chapter"/> for more information.
		/// </summary>
		public ICollection<Chapter> Chapters { get; set; }

		/// <summary>
		/// Create a <see cref="WatchItem"/> from an <see cref="Episode"/>.
		/// </summary>
		/// <param name="ep">The episode to transform.</param>
		/// <param name="library">
		/// A library manager to retrieve the next and previous episode and load the show & tracks of the episode.
		/// </param>
		/// <returns>A new WatchItem representing the given episode.</returns>
		public static async Task<WatchItem> FromEpisode(Episode ep, ILibraryManager library)
		{
			Episode previous = null;
			Episode next = null;

			await library.Load(ep, x => x.Show);
			await library.Load(ep, x => x.Tracks);

			if (!ep.Show.IsMovie && ep.SeasonNumber != null && ep.EpisodeNumber != null)
			{
				if (ep.EpisodeNumber > 1)
					previous = await library.GetOrDefault(ep.ShowID, ep.SeasonNumber.Value, ep.EpisodeNumber.Value - 1);
				else if (ep.SeasonNumber > 1)
				{
					previous = (await library.GetAll(x => x.ShowID == ep.ShowID
					                                      && x.SeasonNumber == ep.SeasonNumber.Value - 1,
						limit: 1,
						sort: new Sort<Episode>(x => x.EpisodeNumber, true))
					).FirstOrDefault();
				}

				if (ep.EpisodeNumber >= await library.GetCount<Episode>(x => x.SeasonID == ep.SeasonID))
					next = await library.GetOrDefault(ep.ShowID, ep.SeasonNumber.Value + 1, 1);
				else
					next = await library.GetOrDefault(ep.ShowID, ep.SeasonNumber.Value, ep.EpisodeNumber.Value + 1);
			}
			else if (!ep.Show.IsMovie && ep.AbsoluteNumber != null)
			{
				previous = await library.GetOrDefault<Episode>(x => x.ShowID == ep.ShowID
				                                                    && x.AbsoluteNumber == ep.EpisodeNumber + 1);
				next = await library.GetOrDefault<Episode>(x => x.ShowID == ep.ShowID
				                                                && x.AbsoluteNumber == ep.AbsoluteNumber + 1);
			}

			return new WatchItem
			{
				EpisodeID = ep.ID,
				Slug = ep.Slug,
				ShowSlug = ep.Show.Slug,
				ShowTitle = ep.Show.Title,
				SeasonNumber = ep.SeasonNumber,
				EpisodeNumber = ep.EpisodeNumber,
				AbsoluteNumber = ep.AbsoluteNumber,
				Title = ep.Title,
				ReleaseDate = ep.ReleaseDate,
				Path = ep.Path,
				Container = PathIO.GetExtension(ep.Path)![1..],
				Video = ep.Tracks.FirstOrDefault(x => x.Type == StreamType.Video),
				Audios = ep.Tracks.Where(x => x.Type == StreamType.Audio).ToArray(),
				Subtitles = ep.Tracks.Where(x => x.Type == StreamType.Subtitle).ToArray(),
				PreviousEpisode = previous,
				NextEpisode = next,
				Chapters = await _GetChapters(ep.Path)
			};
		}

		// TODO move this method in a controller to support abstraction.
		// TODO use a IFileManager to retrieve and read files.
		private static async Task<ICollection<Chapter>> _GetChapters(string episodePath)
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
