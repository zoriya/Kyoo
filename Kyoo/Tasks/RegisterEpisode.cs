using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Exceptions;

namespace Kyoo.Tasks
{
	/// <summary>
	/// A task to register a new episode
	/// </summary>
	[TaskMetadata("register", "Register episode", "Register a new episode")]
	public class RegisterEpisode : ITask
	{
		/// <summary>
		/// An identifier to extract metadata from paths.
		/// </summary>
		private readonly IIdentifier _identifier;
		/// <summary>
		/// The library manager used to register the episode.
		/// </summary>
		private readonly ILibraryManager _libraryManager;
		/// <summary>
		/// A metadata provider to retrieve the metadata of the new episode (and related items if they do not exist).
		/// </summary>
		private readonly AProviderComposite _metadataProvider;
		/// <summary>
		/// The thumbnail manager used to download images.
		/// </summary>
		private readonly IThumbnailsManager _thumbnailsManager;
		/// <summary>
		/// The transcoder used to extract subtitles and metadata.
		/// </summary>
		private readonly ITranscoder _transcoder;

		/// <summary>
		/// Create a new <see cref="RegisterEpisode"/> task.
		/// </summary>
		/// <param name="identifier">
		/// An identifier to extract metadata from paths.
		/// </param>
		/// <param name="libraryManager">
		/// The library manager used to register the episode.
		/// </param>
		/// <param name="metadataProvider">
		/// A metadata provider to retrieve the metadata of the new episode (and related items if they do not exist).
		/// </param>
		/// <param name="thumbnailsManager">
		/// The thumbnail manager used to download images.
		/// </param>
		/// <param name="transcoder">
		/// The transcoder used to extract subtitles and metadata.
		/// </param>
		public RegisterEpisode(IIdentifier identifier,
			ILibraryManager libraryManager,
			AProviderComposite metadataProvider,
			IThumbnailsManager thumbnailsManager,
			ITranscoder transcoder)
		{
			_identifier = identifier;
			_libraryManager = libraryManager;
			_metadataProvider = metadataProvider;
			_thumbnailsManager = thumbnailsManager;
			_transcoder = transcoder;
		}

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
			progress.Report(0);

			if (library != null)
			{
				if (library.Providers == null)
					await _libraryManager.Load(library, x => x.Providers);
				_metadataProvider.UseProviders(library.Providers);
			}

			try
			{
				(Collection collection, Show show, Season season, Episode episode) = await _identifier.Identify(path);
				progress.Report(15);

				collection = await _RegisterAndFill(collection);
				progress.Report(20);

				Show registeredShow = await _RegisterAndFill(show);
				if (registeredShow.Path != show.Path)
				{
					if (show.StartAir.HasValue)
					{
						show.Slug += $"-{show.StartAir.Value.Year}";
						show = await _libraryManager.Create(show);
					}
					else
					{
						throw new TaskFailedException($"Duplicated show found ({show.Slug}) " +
							$"at {registeredShow.Path} and {show.Path}");
					}
				}
				else
					show = registeredShow;

				progress.Report(50);

				if (season != null)
					season.Show = show;
				season = await _RegisterAndFill(season);
				progress.Report(60);

				episode.Show = show;
				episode.Season = season;
				if (!show.IsMovie)
					episode = await _metadataProvider.Get(episode);
				progress.Report(70);
				episode.Tracks = (await _transcoder.ExtractInfos(episode, false))
					.Where(x => x.Type != StreamType.Attachment)
					.ToArray();
				await _thumbnailsManager.DownloadImages(episode);
				progress.Report(90);

				await _libraryManager.Create(episode);
				progress.Report(95);
				await _libraryManager.AddShowLink(show, library, collection);
				progress.Report(100);
			}
			catch (IdentificationFailedException ex)
			{
				throw new TaskFailedException(ex);
			}
			catch (DuplicatedItemException ex)
			{
				throw new TaskFailedException(ex);
			}
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
			where T : class, IResource, IThumbnails, IMetadata
		{
			if (item == null || string.IsNullOrEmpty(item.Slug))
				return null;

			T existing = await _libraryManager.GetOrDefault<T>(item.Slug);
			if (existing != null)
			{
				await _libraryManager.Load(existing, x => x.ExternalIDs);
				return existing;
			}

			item = await _metadataProvider.Get(item);
			await _thumbnailsManager.DownloadImages(item);
			
			switch (item)
			{
				case Show show when show.People != null:
					foreach (PeopleRole role in show.People)
						await _thumbnailsManager.DownloadImages(role.People);
					break;
				case Season season:
					season.Title ??= $"Season {season.SeasonNumber}";
					break;
			}

			return await _libraryManager.CreateIfNotExists(item);
		}
	}
}