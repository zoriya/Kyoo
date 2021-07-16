using System;
using Kyoo.Models;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models.Attributes;
using Kyoo.Models.Watch;
using Microsoft.Extensions.Logging;

namespace Kyoo.Tasks
{
	/// <summary>
	/// A task to add new video files.
	/// </summary>
	public class Crawler : ITask
	{
		/// <inheritdoc />
		public string Slug => "scan";
		
		/// <inheritdoc />
		public string Name => "Scan libraries";
		
		/// <inheritdoc />
		public string Description => "Scan your libraries and load data for new shows.";
		
		/// <inheritdoc />
		public string HelpMessage => "Reloading all libraries is a long process and may take up to" +
			" 24 hours if it is the first scan in a while.";
		
		/// <inheritdoc />
		public bool RunOnStartup => true;
		
		/// <inheritdoc />
		public int Priority => 0;

		/// <inheritdoc />
		public bool IsHidden => false;

		/// <summary>
		/// The library manager used to get libraries and providers to use.
		/// </summary>
		[Injected] public ILibraryManager LibraryManager { private get; set; }
		/// <summary>
		/// The file manager used walk inside directories and check they existences. 
		/// </summary>
		[Injected] public IFileManager FileManager { private get; set; }
		/// <summary>
		/// A task manager used to create sub tasks for each episode to add to the database. 
		/// </summary>
		[Injected] public ITaskManager TaskManager { private get; set; }
		/// <summary>
		/// The logger used to inform the current status to the console.
		/// </summary>
		[Injected] public ILogger<Crawler> Logger { private get; set; }
		
		
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
				? await LibraryManager.GetAll<Library>()
				: new [] { await LibraryManager.GetOrDefault<Library>(argument)};

			if (argument != null && libraries.First() == null)
				throw new ArgumentException($"No library found with the name {argument}");

			foreach (Library library in libraries)
				await LibraryManager.Load(library, x => x.Providers);

			progress.Report(0);
			float percent = 0;
			
			ICollection<Episode> episodes = await LibraryManager.GetAll<Episode>();
			ICollection<Track> tracks = await LibraryManager.GetAll<Track>();
			foreach (Library library in libraries)
			{
				IProgress<float> reporter = new Progress<float>(x =>
				{
					// ReSharper disable once AccessToModifiedClosure
					progress.Report(percent + x / libraries.Count);
				});
				await Scan(library, episodes, tracks, reporter, cancellationToken);
				percent += 100f / libraries.Count;
				
				if (cancellationToken.IsCancellationRequested)
					return;
			}
			
			progress.Report(100);
		}

		private async Task Scan(Library library, 
			IEnumerable<Episode> episodes,
			IEnumerable<Track> tracks,
			IProgress<float> progress,
			CancellationToken cancellationToken)
		{
			Logger.LogInformation("Scanning library {Library} at {Paths}", library.Name, library.Paths);
			foreach (string path in library.Paths)
			{
				ICollection<string> files = await FileManager.ListFiles(path, SearchOption.AllDirectories);
				
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
					progress.Report((percent + x / paths.Length - 10) / library.Paths.Length);
				});
				
				foreach (string episodePath in paths)
				{
					TaskManager.StartTask<RegisterEpisode>(reporter, new Dictionary<string, object>
					{
						["path"] = episodePath[path.Length..],
						["library"] = library
					}, cancellationToken);
					percent += 100f / paths.Length;
				}

				
				string[] subtitles = files
					.Where(FileExtensions.IsSubtitle)
					.Where(x => tracks.All(y => y.Path != x))
					.ToArray();
				percent = 0;
				reporter = new Progress<float>(x =>
				{
					// ReSharper disable once AccessToModifiedClosure
					progress.Report((90 + (percent + x / subtitles.Length)) / library.Paths.Length);
				});
				
				foreach (string trackPath in subtitles)
				{
					TaskManager.StartTask<RegisterSubtitle>(reporter, new Dictionary<string, object>
					{
						["path"] = trackPath
					}, cancellationToken);
					percent += 100f / subtitles.Length;
				}
			}
		}
	}
}
