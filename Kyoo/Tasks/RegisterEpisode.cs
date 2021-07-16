using System;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Kyoo.Models.Attributes;
using Kyoo.Models.Exceptions;
using Microsoft.Extensions.Logging;

namespace Kyoo.Tasks
{
	/// <summary>
	/// A task to register a new episode
	/// </summary>
	public class RegisterEpisode : ITask
	{
		/// <inheritdoc />
		public string Slug => "register";

		/// <inheritdoc />
		public string Name => "Register episode";

		/// <inheritdoc />
		public string Description => "Register a new episode";

		/// <inheritdoc />
		public string HelpMessage => null;

		/// <inheritdoc />
		public bool RunOnStartup => false;

		/// <inheritdoc />
		public int Priority => 0;

		/// <inheritdoc />
		public bool IsHidden => false;
		
		/// <summary>
		/// An identifier to extract metadata from paths.
		/// </summary>
		[Injected] public IIdentifier Identifier { private get; set; }
		/// <summary>
		/// The library manager used to register the episode
		/// </summary>
		[Injected] public ILibraryManager LibraryManager { private get; set; }
		/// <summary>
		/// A metadata provider to retrieve the metadata of the new episode (and related items if they do not exist).
		/// </summary>
		[Injected] public AProviderComposite MetadataProvider { private get; set; }
		/// <summary>
		/// The thumbnail manager used to download images.
		/// </summary>
		[Injected] public IThumbnailsManager ThumbnailsManager { private get; set; }
		/// <summary>
		/// The logger used to inform the current status to the console.
		/// </summary>
		[Injected] public ILogger<RegisterEpisode> Logger { private get; set; }
		
		/// <inheritdoc />
		public TaskParameters GetParameters()
		{
			return new()
			{
				TaskParameter.CreateRequired<string>("path", "The path of the episode file"),
				TaskParameter.Create<Library>("library", "The library in witch the episode is")
			};
		}
		
		/// <inheritdoc />
		public async Task Run(TaskParameters arguments, IProgress<float> progress, CancellationToken cancellationToken)
		{
			string path = arguments["path"].As<string>();
			Library library = arguments["library"].As<Library>();
			
			try
			{
				(Collection collection, Show show, Season season, Episode episode) = await Identifier.Identify(path);
				if (library != null)
					MetadataProvider.UseProviders(library.Providers);

				if (collection != null)
					collection.Slug ??= Utility.ToSlug(collection.Name);
				collection = await _RegisterAndFill(collection);
				show = await _RegisterAndFill(show);
				// if (isMovie)
				// 	await libraryManager!.Create(await GetMovie(show, path));
				// else
				// {
				// 	Season season = seasonNumber != null 
				// 		? await GetSeason(libraryManager, show, seasonNumber.Value, library)
				// 		: null;
				// 	Episode episode = await GetEpisode(libraryManager,
				// 		show,
				// 		season,
				// 		episodeNumber,
				// 		absoluteNumber,
				// 		path,
				// 		library);
				// 	await libraryManager!.Create(episode);
				// }
				//
				// await libraryManager.AddShowLink(show, library, collection);
				// Console.WriteLine($"Episode at {path} registered.");
			}
			catch (DuplicatedItemException ex)
			{
				Logger.LogWarning(ex, "Duplicated found at {Path}", path);
			}
			catch (Exception ex)
			{
				Logger.LogCritical(ex, "Unknown exception thrown while registering episode at {Path}", path);
			}
		}
		
		private async Task<T> _RegisterAndFill<T>(T item)
			where T : class, IResource
		{
			if (item == null || string.IsNullOrEmpty(item.Slug))
				return null;

			T existing = await LibraryManager.GetOrDefault<T>(item.Slug);
			if (existing != null)
				return existing;
			item = await MetadataProvider.Get(item);
			await ThumbnailsManager.DownloadImages(item);
			return await LibraryManager.CreateIfNotExists(item);
		}
		
		// private async Task<Show> GetShow(ILibraryManager libraryManager, 
		// 	string showTitle, 
		// 	string showPath,
		// 	bool isMovie, 
		// 	Library library)
		// {
		// 	Show old = await libraryManager.GetOrDefault<Show>(x => x.Path == showPath);
		// 	if (old != null)
		// 	{
		// 		await libraryManager.Load(old, x => x.ExternalIDs);
		// 		return old;
		// 	}
		//
		// 	Show show = await MetadataProvider.SearchShow(showTitle, isMovie, library);
		// 	show.Path = showPath;
		// 	show.People = await MetadataProvider.GetPeople(show, library);
		//
		// 	try
		// 	{
		// 		show = await libraryManager.Create(show);
		// 	}
		// 	catch (DuplicatedItemException)
		// 	{
		// 		old = await libraryManager.GetOrDefault<Show>(show.Slug);
		// 		if (old != null && old.Path == showPath)
		// 		{
		// 			await libraryManager.Load(old, x => x.ExternalIDs);
		// 			return old;
		// 		}
		//
		// 		if (show.StartAir != null)
		// 		{
		// 			show.Slug += $"-{show.StartAir.Value.Year}";
		// 			await libraryManager.Create(show);
		// 		}
		// 		else
		// 			throw;
		// 	}
		// 	await ThumbnailsManager.Validate(show);
		// 	return show;
		// }
		//
		/*
		 *
		private async Task RegisterExternalSubtitle(string path, CancellationToken token)
		{
			try
			{
				if (token.IsCancellationRequested || path.Split(Path.DirectorySeparatorChar).Contains("Subtitles"))
					return;
				using IServiceScope serviceScope = ServiceProvider.CreateScope();
				ILibraryManager libraryManager = serviceScope.ServiceProvider.GetService<ILibraryManager>();

				string patern = Config.GetValue<string>("subtitleRegex");
				Regex regex = new(patern, RegexOptions.IgnoreCase);
				Match match = regex.Match(path);

				if (!match.Success)
				{
					await Console.Error.WriteLineAsync($"The subtitle at {path} does not match the subtitle's regex.");
					return;
				}

				string episodePath = match.Groups["Episode"].Value;
				Episode episode = await libraryManager!.Get<Episode>(x => x.Path.StartsWith(episodePath));
				Track track = new()
				{
					Type = StreamType.Subtitle,
					Language = match.Groups["Language"].Value,
					IsDefault = match.Groups["Default"].Value.Length > 0, 
					IsForced = match.Groups["Forced"].Value.Length > 0,
					Codec = SubtitleExtensions[Path.GetExtension(path)],
					IsExternal = true,
					Path = path,
					Episode = episode
				};

				await libraryManager.Create(track);
				Console.WriteLine($"Registering subtitle at: {path}.");
			}
			catch (ItemNotFoundException)
			{
				await Console.Error.WriteLineAsync($"No episode found for subtitle at: ${path}.");
			}
			catch (Exception ex)
			{
				await Console.Error.WriteLineAsync($"Unknown error while registering subtitle: {ex.Message}");
			}
		}

		private async Task<Season> GetSeason(ILibraryManager libraryManager, 
			Show show, 
			int seasonNumber, 
			Library library)
		{
			try
			{
				Season season = await libraryManager.Get(show.Slug, seasonNumber);
				season.Show = show;
				return season;
			}
			catch (ItemNotFoundException)
			{
				Season season = new();//await MetadataProvider.GetSeason(show, seasonNumber, library);
				try
				{
					await libraryManager.Create(season);
					await ThumbnailsManager.Validate(season);
				}
				catch (DuplicatedItemException)
				{
					season = await libraryManager.Get(show.Slug, seasonNumber);
				}
				season.Show = show;
				return season;
			}
		}
		
		private async Task<Episode> GetEpisode(ILibraryManager libraryManager, 
			Show show, 
			Season season,
			int? episodeNumber,
			int? absoluteNumber, 
			string episodePath, 
			Library library)
		{
			Episode episode = new();
			//await MetadataProvider.GetEpisode(show,
			//	episodePath, 
			//	season?.SeasonNumber, 
			//	episodeNumber,
			//	absoluteNumber,
			//	library);

			if (episode.SeasonNumber != null)
			{
				season ??= await GetSeason(libraryManager, show, episode.SeasonNumber.Value, library);
				episode.Season = season;
				episode.SeasonID = season?.ID;
			}
			await ThumbnailsManager.Validate(episode);
			await GetTracks(episode);
			return episode;
		}

		private async Task<Episode> GetMovie(Show show, string episodePath)
		{
			Episode episode = new()
			{
				Title = show.Title,
				Path = episodePath,
				Show = show,
				ShowID = show.ID,
				ShowSlug = show.Slug
			};
			episode.Tracks = await GetTracks(episode);
			return episode;
		}

		private async Task<ICollection<Track>> GetTracks(Episode episode)
		{
			episode.Tracks = (await Transcoder.ExtractInfos(episode, false))
				.Where(x => x.Type != StreamType.Attachment)
				.ToArray();
			return episode.Tracks;
		}
	*/
	}
}