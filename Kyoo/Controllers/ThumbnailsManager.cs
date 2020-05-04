using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Threading.Tasks;

namespace Kyoo.Controllers
{
	public class ThumbnailsManager : IThumbnailsManager
	{
		private readonly IConfiguration _config;

		public ThumbnailsManager(IConfiguration configuration)
		{
			_config = configuration;
		}

		private static async Task DownloadImage(string url, string localPath, string what)
		{
			try
			{
				using WebClient client = new WebClient();
				await client.DownloadFileTaskAsync(new Uri(url), localPath);
			}
			catch (WebException exception)
			{
				await Console.Error.WriteLineAsync($"\t{what} could not be downloaded.\n\tError: {exception.Message}.");
			}
		}

		public async Task<Show> Validate(Show show, bool alwaysDownload)
		{
			if (show?.Path == null)
				return default;

			if (show.Poster != null)
			{
				string posterPath = Path.Combine(show.Path, "poster.jpg");
				if (alwaysDownload || !File.Exists(posterPath))
					await DownloadImage(show.Poster, posterPath, $"The poster of {show.Title}");
			}
			if (show.Logo != null)
			{
				string logoPath = Path.Combine(show.Path, "logo.png");
				if (alwaysDownload || !File.Exists(logoPath))
					await DownloadImage(show.Logo, logoPath, $"The logo of {show.Title}");
			}
			if (show.Backdrop != null)
			{
				string backdropPath = Path.Combine(show.Path, "backdrop.jpg");
				if (alwaysDownload || !File.Exists(backdropPath))
					await DownloadImage(show.Backdrop, backdropPath, $"The backdrop of {show.Title}");
			}

			return show;
		}

		public async Task<IEnumerable<PeopleLink>> Validate(IEnumerable<PeopleLink> people, bool alwaysDownload)
		{
			if (people == null)
				return null;
			
			string root = _config.GetValue<string>("peoplePath");
			Directory.CreateDirectory(root);
			
			foreach (PeopleLink peop in people)
			{
				string localPath = Path.Combine(root, peop.People.Slug + ".jpg");
				if (peop.People.ImgPrimary == null)
					continue;
				if (alwaysDownload || !File.Exists(localPath))
					await DownloadImage(peop.People.ImgPrimary, localPath, $"The profile picture of {peop.People.Name}");
			}
			
			return people;
		}

		public async Task<Episode> Validate(Episode episode, bool alwaysDownload)
		{
			if (episode?.Path == null)
				return default;

			if (episode.ImgPrimary == null)
			{
				string localPath = Path.ChangeExtension(episode.Path, "jpg");
				if (alwaysDownload || !File.Exists(localPath))
					await DownloadImage(episode.ImgPrimary, localPath, $"The thumbnail of {episode.Show.Title}");
			}
			return episode;
		}
	}
}
