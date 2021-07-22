using System;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Common.Models.Attributes;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.Extensions.Logging;

namespace Kyoo.Tasks
{
	/// <summary>
	/// A task to remove orphaned episode and series.
	/// </summary>
	[TaskMetadata("housekeeping", "Housekeeping", "Remove orphaned episode and series.", RunOnStartup = true)]
	public class Housekeeping : ITask
	{
		/// <summary>
		/// The library manager used to get libraries or remove deleted episodes.
		/// </summary>
		private readonly ILibraryManager _libraryManager;
		/// <summary>
		/// The file manager used walk inside directories and check they existences. 
		/// </summary>
		private readonly IFileSystem _fileSystem;
		/// <summary>
		/// The logger used to inform the user that episodes has been removed. 
		/// </summary>
		private readonly ILogger<Housekeeping> _logger;

		/// <summary>
		/// Create a new <see cref="Housekeeping"/> task.
		/// </summary>
		/// <param name="libraryManager">The library manager used to get libraries or remove deleted episodes.</param>
		/// <param name="fileSystem">The file manager used walk inside directories and check they existences.</param>
		/// <param name="logger">The logger used to inform the user that episodes has been removed.</param>
		public Housekeeping(ILibraryManager libraryManager, IFileSystem fileSystem, ILogger<Housekeeping> logger)
		{
			_libraryManager = libraryManager;
			_fileSystem = fileSystem;
			_logger = logger;
		}

		/// <inheritdoc />
		public TaskParameters GetParameters()
		{
			return new();
		}

		/// <inheritdoc />
		public async Task Run(TaskParameters arguments, IProgress<float> progress, CancellationToken cancellationToken)
		{
			int count = 0;
			int delCount = await _libraryManager.GetCount<Show>() + await _libraryManager.GetCount<Episode>();
			progress.Report(0);

			foreach (Show show in await _libraryManager.GetAll<Show>())
			{
				progress.Report(count / delCount * 100);
				count++;
				
				if (await _fileSystem.Exists(show.Path))
					continue;
				_logger.LogWarning("Show {Name}'s folder has been deleted (was {Path}), removing it from kyoo", 
					show.Title, show.Path);
				await _libraryManager.Delete(show);
			}

			foreach (Episode episode in await _libraryManager.GetAll<Episode>())
			{
				progress.Report(count / delCount * 100);
				count++;
				
				if (await _fileSystem.Exists(episode.Path))
					continue;
				_logger.LogWarning("Episode {Slug}'s file has been deleted (was {Path}), removing it from kyoo", 
					episode.Slug, episode.Path);
				await _libraryManager.Delete(episode);
			}
			
			progress.Report(100);
		}
	}
}