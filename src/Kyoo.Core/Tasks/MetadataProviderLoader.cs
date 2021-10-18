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
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Exceptions;

namespace Kyoo.Core.Tasks
{
	/// <summary>
	/// A task that download metadata providers images.
	/// </summary>
	[TaskMetadata("reload-metadata", "Reload Metadata Providers", "Add every loaded metadata provider to the database.",
		RunOnStartup = true, Priority = 1000, IsHidden = true)]
	public class MetadataProviderLoader : ITask
	{
		/// <summary>
		/// The provider repository used to create in-db providers from metadata providers.
		/// </summary>
		private readonly IProviderRepository _providers;

		/// <summary>
		/// The thumbnail manager used to download providers logo.
		/// </summary>
		private readonly IThumbnailsManager _thumbnails;

		/// <summary>
		/// The list of metadata providers to register.
		/// </summary>
		private readonly ICollection<IMetadataProvider> _metadataProviders;

		/// <summary>
		/// Create a new <see cref="MetadataProviderLoader"/> task.
		/// </summary>
		/// <param name="providers">
		/// The provider repository used to create in-db providers from metadata providers.
		/// </param>
		/// <param name="thumbnails">
		/// The thumbnail manager used to download providers logo.
		/// </param>
		/// <param name="metadataProviders">
		/// The list of metadata providers to register.
		/// </param>
		public MetadataProviderLoader(IProviderRepository providers,
			IThumbnailsManager thumbnails,
			ICollection<IMetadataProvider> metadataProviders)
		{
			_providers = providers;
			_thumbnails = thumbnails;
			_metadataProviders = metadataProviders;
		}

		/// <inheritdoc />
		public TaskParameters GetParameters()
		{
			return new TaskParameters();
		}

		/// <inheritdoc />
		public async Task Run(TaskParameters arguments, IProgress<float> progress, CancellationToken cancellationToken)
		{
			float percent = 0;
			progress.Report(0);

			foreach (IMetadataProvider provider in _metadataProviders)
			{
				if (string.IsNullOrEmpty(provider.Provider.Slug))
					throw new TaskFailedException($"Empty provider slug (name: {provider.Provider.Name}).");
				await _providers.CreateIfNotExists(provider.Provider);
				await _thumbnails.DownloadImages(provider.Provider);
				percent += 100f / _metadataProviders.Count;
				progress.Report(percent);
			}
			progress.Report(100);
		}
	}
}
