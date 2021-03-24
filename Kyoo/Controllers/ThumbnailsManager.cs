using Kyoo.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using JetBrains.Annotations;

namespace Kyoo.Controllers
{
	public class ThumbnailsManager : IThumbnailsManager
	{
		private readonly IFileManager _files;
		private readonly string _peoplePath;
		private readonly string _providerPath;

		public ThumbnailsManager(IConfiguration configuration, IFileManager files)
		{
			_files = files;
			_peoplePath = Path.GetFullPath(configuration.GetValue<string>("peoplePath"));
			_providerPath = Path.GetFullPath(configuration.GetValue<string>("providerPath"));
			Directory.CreateDirectory(_peoplePath);
			Directory.CreateDirectory(_providerPath);
		}

		private static async Task DownloadImage(string url, string localPath, string what)
		{
			try
			{
				using WebClient client = new();
				await client.DownloadFileTaskAsync(new Uri(url), localPath);
			}
			catch (WebException exception)
			{
				await Console.Error.WriteLineAsync($"{what} could not be downloaded. Error: {exception.Message}.");
			}
		}

		public async Task Validate(Show show, bool alwaysDownload)
		{
			if (show.Poster != null)
			{
				string posterPath = await GetShowPoster(show);
				if (alwaysDownload || !File.Exists(posterPath))
					await DownloadImage(show.Poster, posterPath, $"The poster of {show.Title}");
			}
			if (show.Logo != null)
			{
				string logoPath = await GetShowLogo(show);
				if (alwaysDownload || !File.Exists(logoPath))
					await DownloadImage(show.Logo, logoPath, $"The logo of {show.Title}");
			}
			if (show.Backdrop != null)
			{
				string backdropPath = await GetShowBackdrop(show);
				if (alwaysDownload || !File.Exists(backdropPath))
					await DownloadImage(show.Backdrop, backdropPath, $"The backdrop of {show.Title}");
			}
			
			foreach (PeopleRole role in show.People)
				await Validate(role.People, alwaysDownload);
		}

		public async Task Validate([NotNull] People people, bool alwaysDownload)
		{
			if (people == null)
				throw new ArgumentNullException(nameof(people));
			if (people.Poster == null)
				return;
			string localPath = await GetPeoplePoster(people);
			if (alwaysDownload || !File.Exists(localPath))
				await DownloadImage(people.Poster, localPath, $"The profile picture of {people.Name}");
		}

		public async Task Validate(Season season, bool alwaysDownload)
		{
			if (season?.Show?.Path == null || season.Poster == null)
				return;

			string localPath = await GetSeasonPoster(season);
			if (alwaysDownload || !File.Exists(localPath))
				await DownloadImage(season.Poster, localPath, $"The poster of {season.Show.Title}'s season {season.SeasonNumber}");
		}
		
		public async Task Validate(Episode episode, bool alwaysDownload)
		{
			if (episode?.Path == null || episode.Thumb == null)
				return;

			string localPath = await GetEpisodeThumb(episode);
			if (alwaysDownload || !File.Exists(localPath))
				await DownloadImage(episode.Thumb, localPath, $"The thumbnail of {episode.Slug}");
		}

		public async Task Validate(ProviderID provider, bool alwaysDownload)
		{
			if (provider.Logo == null)
				return;

			string localPath = await GetProviderLogo(provider);
			if (alwaysDownload || !File.Exists(localPath))
				await DownloadImage(provider.Logo, localPath, $"The logo of {provider.Slug}");
		}

		public Task<string> GetShowBackdrop(Show show)
		{
			if (show?.Path == null)
				throw new ArgumentNullException(nameof(show));
			return Task.FromResult(Path.Combine(_files.GetExtraDirectory(show), "backdrop.jpg"));
		}
		
		public Task<string> GetShowLogo(Show show)
		{
			if (show?.Path == null)
				throw new ArgumentNullException(nameof(show));
			return Task.FromResult(Path.Combine(_files.GetExtraDirectory(show), "logo.png"));
		}
		
		public Task<string> GetShowPoster(Show show)
		{
			if (show?.Path == null)
				throw new ArgumentNullException(nameof(show));
			return Task.FromResult(Path.Combine(_files.GetExtraDirectory(show), "poster.jpg"));
		}

		public Task<string> GetSeasonPoster(Season season)
		{
			if (season == null)
				throw new ArgumentNullException(nameof(season));
			return Task.FromResult(Path.Combine(_files.GetExtraDirectory(season), $"season-{season.SeasonNumber}.jpg"));
		}

		public Task<string> GetEpisodeThumb(Episode episode)
		{
			string dir = Path.Combine(_files.GetExtraDirectory(episode), "Thumbnails");
			Directory.CreateDirectory(dir);
			return Task.FromResult(Path.Combine(dir, $"{Path.GetFileNameWithoutExtension(episode.Path)}.jpg"));
		}

		public Task<string> GetPeoplePoster(People people)
		{
			if (people == null)
				throw new ArgumentNullException(nameof(people));
			string thumbPath = Path.GetFullPath(Path.Combine(_peoplePath, $"{people.Slug}.jpg"));
			if (!thumbPath.StartsWith(_peoplePath))
				return Task.FromResult<string>(null);
			return Task.FromResult(thumbPath);
		}

		public Task<string> GetProviderLogo(ProviderID provider)
		{
			if (provider == null)
				throw new ArgumentNullException(nameof(provider));
			string thumbPath = Path.GetFullPath(Path.Combine(_providerPath, $"{provider.Slug}.png"));
			return Task.FromResult(thumbPath.StartsWith(_providerPath) ? thumbPath : null);
		}
	}
}
