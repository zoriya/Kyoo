using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Core.Models.Watch;
using Microsoft.Extensions.Logging;

namespace Kyoo.Core.Tasks
{
	/// <summary>
	/// A task to add new video files.
	/// </summary>
	[TaskMetadata("scan", "Scan libraries", "Scan your libraries and load data for new shows.", RunOnStartup = true)]
	public class Crawler : ITask
	{
		/// <summary>
		/// The library manager used to get libraries and providers to use.
		/// </summary>
		private readonly ILibraryManager _libraryManager;

		/// <summary>
		/// The file manager used walk inside directories and check they existences.
		/// </summary>
		private readonly IFileSystem _fileSystem;

		/// <summary>
		/// A task manager used to create sub tasks for each episode to add to the database.
		/// </summary>
		private readonly ITaskManager _taskManager;

		/// <summary>
		/// The logger used to inform the current status to the console.
		/// </summary>
		private readonly ILogger<Crawler> _logger;

		/// <summary>
		/// Create a new <see cref="Crawler"/>.
		/// </summary>
		/// <param name="libraryManager">The library manager to retrieve existing episodes/library/tracks</param>
		/// <param name="fileSystem">The file system to glob files</param>
		/// <param name="taskManager">The task manager used to start <see cref="RegisterEpisode"/>.</param>
		/// <param name="logger">The logger used print messages.</param>
		public Crawler(ILibraryManager libraryManager,
			IFileSystem fileSystem,
			ITaskManager taskManager,
			ILogger<Crawler> logger)
		{
			_libraryManager = libraryManager;
			_fileSystem = fileSystem;
			_taskManager = taskManager;
			_logger = logger;
		}

		/// <inheritdoc />
		public TaskParameters GetParameters()
		{
			return new()
			{
				TaskParameter.Create<string>("slug", "A library slug to restrict the scan to this library.")
			};
		}

		/// <inheritdoc />
		public async Task Run(TaskParameters arguments, IProgress<float> progress, CancellationToken cancellationToken)
		{
			string argument = arguments["slug"].As<string>();
			ICollection<Library> libraries = argument == null
				? await _libraryManager.GetAll<Library>()
				: new[] { await _libraryManager.GetOrDefault<Library>(argument) };

			if (argument != null && libraries.First() == null)
				throw new ArgumentException($"No library found with the name {argument}");

			foreach (Library library in libraries)
				await _libraryManager.Load(library, x => x.Providers);

			progress.Report(0);
			float percent = 0;

			ICollection<Episode> episodes = await _libraryManager.GetAll<Episode>();
			ICollection<Track> tracks = await _libraryManager.GetAll<Track>();
			foreach (Library library in libraries)
			{
				IProgress<float> reporter = new Progress<float>(x =>
				{
					// ReSharper disable once AccessToModifiedClosure
					progress.Report(percent + (x / libraries.Count));
				});
				await _Scan(library, episodes, tracks, reporter, cancellationToken);
				percent += 100f / libraries.Count;

				if (cancellationToken.IsCancellationRequested)
					return;
			}

			progress.Report(100);
		}

		private async Task _Scan(Library library,
			IEnumerable<Episode> episodes,
			IEnumerable<Track> tracks,
			IProgress<float> progress,
			CancellationToken cancellationToken)
		{
			_logger.LogInformation("Scanning library {Library} at {Paths}", library.Name, library.Paths);
			foreach (string path in library.Paths)
			{
				ICollection<string> files = await _fileSystem.ListFiles(path, SearchOption.AllDirectories);

				if (cancellationToken.IsCancellationRequested)
					return;

				// We try to group episodes by shows to register one episode of each show first.
				// This speeds up the scan process because further episodes of a show are registered when all metadata
				// of the show has already been fetched.
				List<IGrouping<string, string>> shows = files
					.Where(FileExtensions.IsVideo)
					.Where(x => episodes.All(y => y.Path != x))
					.GroupBy(Path.GetDirectoryName)
					.ToList();

				string[] paths = shows.Select(x => x.First())
					.Concat(shows.SelectMany(x => x.Skip(1)))
					.ToArray();
				float percent = 0;
				IProgress<float> reporter = new Progress<float>(x =>
				{
					// ReSharper disable once AccessToModifiedClosure
					progress.Report((percent + (x / paths.Length) - 10) / library.Paths.Length);
				});

				foreach (string episodePath in paths)
				{
					_taskManager.StartTask<RegisterEpisode>(reporter, new Dictionary<string, object>
					{
						["path"] = episodePath,
						["library"] = library
					}, cancellationToken);
					percent += 100f / paths.Length;
				}

				string[] subtitles = files
					.Where(FileExtensions.IsSubtitle)
					.Where(x => !x.Contains("Extra"))
					.Where(x => tracks.All(y => y.Path != x))
					.ToArray();
				percent = 0;
				reporter = new Progress<float>(x =>
				{
					// ReSharper disable once AccessToModifiedClosure
					progress.Report((90 + (percent + (x / subtitles.Length))) / library.Paths.Length);
				});

				foreach (string trackPath in subtitles)
				{
					_taskManager.StartTask<RegisterSubtitle>(reporter, new Dictionary<string, object>
					{
						["path"] = trackPath
					}, cancellationToken);
					percent += 100f / subtitles.Length;
				}
			}
		}
	}
}
