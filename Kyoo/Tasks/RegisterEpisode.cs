using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Kyoo.Models.Attributes;
using Kyoo.Models.Exceptions;

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

		/// <inheritdoc />
		public TaskParameters GetParameters()
		{
			return new()
			{
				TaskParameter.CreateRequired<string>("path", "The path of the episode file"),
				TaskParameter.CreateRequired<string>("relativePath",
					"The path of the episode file relative to the library root. It starts with a /."),
				TaskParameter.CreateRequired<Library>("library", "The library in witch the episode is")
			};
		}
		
		/// <inheritdoc />
		public async Task Run(TaskParameters arguments, IProgress<float> progress, CancellationToken cancellationToken)
		{
			string path = arguments["path"].As<string>();
			string relativePath = arguments["relativePath"].As<string>();
			Library library = arguments["library"].As<Library>();
			progress.Report(0);
			
			if (library.Providers == null)
				await LibraryManager.Load(library, x => x.Providers);
			MetadataProvider.UseProviders(library.Providers);
			(Collection collection, Show show, Season season, Episode episode) = await Identifier.Identify(path, 
				relativePath);
			progress.Report(15);
			
			collection = await _RegisterAndFill(collection);
			progress.Report(20);
			
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
					throw new DuplicatedItemException($"Duplicated show found ({show.Slug}) " +
						$"at {registeredShow.Path} and {show.Path}");
				}
			}
			else
				show = registeredShow;
			// If they are not already loaded, load external ids to allow metadata providers to use them.
			if (show.ExternalIDs == null)
				await LibraryManager.Load(show, x => x.ExternalIDs);
			progress.Report(50);

			if (season != null)
				season.Show = show;

			season = await _RegisterAndFill(season);
			progress.Report(60);

			episode = await MetadataProvider.Get(episode);
			progress.Report(70);
			episode.Show = show;
			episode.Season = season;
			episode.Tracks = (await Transcoder.ExtractInfos(episode, false))
				.Where(x => x.Type != StreamType.Attachment)
				.ToArray();
			await ThumbnailsManager.DownloadImages(episode);
			progress.Report(90);

			await LibraryManager.Create(episode);
			progress.Report(95);
			await LibraryManager.AddShowLink(show, library, collection);
			progress.Report(100);
		}
		
		/// <summary>
		/// Retrieve the equivalent item if it already exists in the database,
		/// if it does not, fill metadata using the metadata provider, download images and register the item to the
		/// database.
		/// </summary>
		/// <param name="item">The item to retrieve or fill and register</param>
		/// <typeparam name="T">The type of the item</typeparam>
		/// <returns>The existing or filled item.</returns>
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
	}
}