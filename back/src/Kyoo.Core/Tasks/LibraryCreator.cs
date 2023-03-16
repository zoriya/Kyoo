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
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Utils;

namespace Kyoo.Core.Tasks
{
	/// <summary>
	/// A task to add new video files.
	/// </summary>
	[TaskMetadata("library-creator", "Create libraries", "Create libraries on the library root folder.",
		RunOnStartup = true, Priority = 500)]
	public class LibraryCreator : ITask
	{
		/// <summary>
		/// The library manager used to get libraries and providers to use.
		/// </summary>
		private readonly ILibraryManager _libraryManager;

		/// <summary>
		/// Create a new <see cref="Crawler"/>.
		/// </summary>
		/// <param name="libraryManager">The library manager to retrieve existing episodes/library/tracks</param>
		public LibraryCreator(ILibraryManager libraryManager)
		{
			_libraryManager = libraryManager;
		}

		/// <inheritdoc />
		public TaskParameters GetParameters()
		{
			return new();
		}

		/// <inheritdoc />
		public async Task Run(TaskParameters arguments, IProgress<float> progress, CancellationToken cancellationToken)
		{
			ICollection<Provider> providers = await _libraryManager.GetAll<Provider>();
			ICollection<string> existings = (await _libraryManager.GetAll<Library>()).SelectMany(x => x.Paths).ToArray();
			IEnumerable<Library> newLibraries = Directory.GetDirectories(Environment.GetEnvironmentVariable("KYOO_LIBRARY_ROOT") ?? "/video")
				.Where(x => !existings.Contains(x))
				.Select(x => new Library
				{
					Slug = Utility.ToSlug(Path.GetFileName(x)),
					Name = Path.GetFileName(x),
					Paths = new string[] { x },
					Providers = providers,
				});

			foreach (Library library in newLibraries)
			{
				await _libraryManager.Create(library);
			}
		}
	}
}
