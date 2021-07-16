using System;
using System.Linq;
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
		/// The transcoder used to extract subtitles and metadata.
		/// </summary>
		[Injected] public ITranscoder Transcoder { private get; set; }
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
				TaskParameter.CreateRequired<Library>("library", "The library in witch the episode is")
			};
		}
		
		/// <inheritdoc />
		public async Task Run(TaskParameters arguments, IProgress<float> progress, CancellationToken cancellationToken)
		{
			string path = arguments["path"].As<string>();
			Library library = arguments["library"].As<Library>();
			
			try
			{
				if (library != null)
				{
					if (library.Providers == null)
						await LibraryManager.Load(library, x => x.Providers);
					MetadataProvider.UseProviders(library.Providers);
				}

				(Collection collection, Show show, Season season, Episode episode) = await Identifier.Identify(path);
				
				collection = await _RegisterAndFill(collection);
				
				Show registeredShow = await _RegisterAndFill(show);
				if (registeredShow.Path != show.Path)
				{
					if (show.StartAir.HasValue)
					{
						show.Slug += $"-{show.StartAir.Value.Year}";
						show = await LibraryManager.Create(show);
					}
					else
					{
						Logger.LogError("Duplicated show found ({Slug}) at {Path1} and {Path2}",
							show.Slug, registeredShow.Path, show.Path);
						return;
					}
				}
				else
					show = registeredShow;

				if (season != null)
					season.Show = show;
				season = await _RegisterAndFill(season);

				episode = await MetadataProvider.Get(episode);
				episode.Season = season;
				episode.Tracks = (await Transcoder.ExtractInfos(episode, false))
					.Where(x => x.Type != StreamType.Attachment)
					.ToArray();
				await ThumbnailsManager.DownloadImages(episode);

				await LibraryManager.Create(episode);
				await LibraryManager.AddShowLink(show, library, collection);
			}
			catch (DuplicatedItemException ex)
			{
				Logger.LogWarning(ex, "Duplicated found at {Path}", path);
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
	*/
	}
}