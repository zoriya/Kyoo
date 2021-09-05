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
		///	Create a new <see cref="MetadataProviderLoader"/> task.
		/// </summary>
		/// <param name="providers">
		///	The provider repository used to create in-db providers from metadata providers.
		/// </param>
		/// <param name="thumbnails">
		///	The thumbnail manager used to download providers logo.
		/// </param>
		/// <param name="metadataProviders">
		///	The list of metadata providers to register.
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
			return new();
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
