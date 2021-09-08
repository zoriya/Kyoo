// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Exceptions;

namespace Kyoo.Core.Tasks
{
	/// <summary>
	/// A task to register a new episode
	/// </summary>
	[TaskMetadata("register-sub", "Register subtitle", "Register a new subtitle")]
	public class RegisterSubtitle : ITask
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
		/// Create a new <see cref="RegisterSubtitle"/> task.
		/// </summary>
		/// <param name="identifier">An identifier to extract metadata from paths.</param>
		/// <param name="libraryManager">The library manager used to register the episode.</param>
		public RegisterSubtitle(IIdentifier identifier, ILibraryManager libraryManager)
		{
			_identifier = identifier;
			_libraryManager = libraryManager;
		}

		/// <inheritdoc />
		public TaskParameters GetParameters()
		{
			return new()
			{
				TaskParameter.CreateRequired<string>("path", "The path of the subtitle file")
			};
		}

		/// <inheritdoc />
		public async Task Run(TaskParameters arguments, IProgress<float> progress, CancellationToken cancellationToken)
		{
			string path = arguments["path"].As<string>();

			try
			{
				progress.Report(0);
				Track track = await _identifier.IdentifyTrack(path);
				progress.Report(25);

				if (track.Episode == null)
					throw new TaskFailedException($"No episode identified for the track at {path}");
				if (track.Episode.ID == 0)
				{
					if (track.Episode.Slug != null)
						track.Episode = await _libraryManager.Get<Episode>(track.Episode.Slug);
					else if (track.Episode.Path != null)
					{
						track.Episode = await _libraryManager.GetOrDefault<Episode>(x => x.Path.StartsWith(track.Episode.Path));
						if (track.Episode == null)
							throw new TaskFailedException($"No episode found for the track at: {path}.");
					}
					else
						throw new TaskFailedException($"No episode identified for the track at {path}");
				}

				progress.Report(50);
				await _libraryManager.Create(track);
				progress.Report(100);
			}
			catch (IdentificationFailedException ex)
			{
				throw new TaskFailedException(ex);
			}
		}
	}
}
