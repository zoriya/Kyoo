using System;
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
	public class RegisterSubtitle : ITask
	{
		/// <inheritdoc />
		public string Slug => "register-sub";

		/// <inheritdoc />
		public string Name => "Register subtitle";

		/// <inheritdoc />
		public string Description => "Register a new subtitle";

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

		/// <inheritdoc />
		public TaskParameters GetParameters()
		{
			return new()
			{
				TaskParameter.CreateRequired<string>("path", "The path of the subtitle file"),
				TaskParameter.CreateRequired<string>("relativePath",
					"The path of the subtitle file relative to the library root. It starts with a /.")
			};
		}
		
		/// <inheritdoc />
		public async Task Run(TaskParameters arguments, IProgress<float> progress, CancellationToken cancellationToken)
		{
			string path = arguments["path"].As<string>();
			string relativePath = arguments["relativePath"].As<string>();

			try
			{
				progress.Report(0);
				Track track = await Identifier.IdentifyTrack(path, relativePath);
				progress.Report(25);

				if (track.Episode == null)
					throw new TaskFailedException($"No episode identified for the track at {path}");
				if (track.Episode.ID == 0)
				{
					if (track.Episode.Slug != null)
						track.Episode = await LibraryManager.Get<Episode>(track.Episode.Slug);
					else if (track.Episode.Path != null)
					{
						track.Episode = await LibraryManager.GetOrDefault<Episode>(x => x.Path.StartsWith(track.Episode.Path));
						if (track.Episode == null)
							throw new TaskFailedException($"No episode found for the track at: {path}.");
					}
					else
						throw new TaskFailedException($"No episode identified for the track at {path}");
				}

				progress.Report(50);
				await LibraryManager.Create(track);
				progress.Report(100);
			}
			catch (IdentificationFailed ex)
			{
				throw new TaskFailedException(ex);
			}
		}
	}
}