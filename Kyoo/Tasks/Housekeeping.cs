using System;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Kyoo.Models.Attributes;

namespace Kyoo.Tasks
{
	public class Housekeeping : ITask
	{
		/// <inheritdoc />
		public string Slug => "housekeeping";

		/// <inheritdoc />
		public string Name => "Housekeeping";

		/// <inheritdoc />
		public string Description => "Remove orphaned episode and series.";

		/// <inheritdoc />
		public string HelpMessage => null;

		/// <inheritdoc />
		public bool RunOnStartup => true;

		/// <inheritdoc />
		public int Priority => 0;

		/// <inheritdoc />
		public bool IsHidden => false;
		
		
		/// <summary>
		/// The library manager used to get libraries or remove deleted episodes 
		/// </summary>
		[Injected] public ILibraryManager LibraryManager { private get; set; }
		/// <summary>
		/// The file manager used walk inside directories and check they existences. 
		/// </summary>
		[Injected] public IFileManager FileManager { private get; set; }

		
		/// <inheritdoc />
		public async Task Run(TaskParameters arguments, IProgress<float> progress, CancellationToken cancellationToken)
		{
			int count = 0;
			int delCount = await LibraryManager.GetCount<Show>() + await LibraryManager.GetCount<Episode>();
			progress.Report(0);

			foreach (Show show in await LibraryManager.GetAll<Show>())
			{
				progress.Report(count / delCount * 100);
				count++;
				
				if (await FileManager.Exists(show.Path))
					continue;
				await LibraryManager.Delete(show);
			}

			foreach (Episode episode in await LibraryManager.GetAll<Episode>())
			{
				progress.Report(count / delCount * 100);
				count++;
				
				if (await FileManager.Exists(episode.Path))
					continue;
				await LibraryManager.Delete(episode);
			}
			
			progress.Report(100);
		}

		/// <inheritdoc />
		public TaskParameters GetParameters()
		{
			return new();
		}
	}
}