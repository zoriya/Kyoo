using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models.Attributes;
using Kyoo.Models.Exceptions;

namespace Kyoo.Tasks
{
	/// <summary>
	/// A task that download metadata providers images.
	/// </summary>
	public class MetadataProviderLoader : ITask
	{
		/// <inheritdoc />
		public string Slug => "reload-metdata";
		
		/// <inheritdoc />
		public string Name => "Reload Metadata Providers";
		
		/// <inheritdoc />
		public string Description => "Add every loaded metadata provider to the database.";
		
		/// <inheritdoc />
		public string HelpMessage => null;
		
		/// <inheritdoc />
		public bool RunOnStartup => true;
		
		/// <inheritdoc />
		public int Priority => 1000;

		/// <inheritdoc />
		public bool IsHidden => true;
		
		/// <summary>
		/// The provider repository used to create in-db providers from metadata providers. 
		/// </summary>
		[Injected] public IProviderRepository Providers { private get; set; }
		/// <summary>
		/// The thumbnail manager used to download providers logo.
		/// </summary>
		[Injected] public IThumbnailsManager Thumbnails { private get; set; }
		/// <summary>
		/// The list of metadata providers to register.
		/// </summary>
		[Injected] public ICollection<IMetadataProvider> MetadataProviders { private get; set; }
		
		
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
			
			foreach (IMetadataProvider provider in MetadataProviders)
			{
				if (string.IsNullOrEmpty(provider.Provider.Slug))
					throw new TaskFailedException($"Empty provider slug (name: {provider.Provider.Name}).");
				await Providers.CreateIfNotExists(provider.Provider);
				await Thumbnails.DownloadImages(provider.Provider);
				percent += 100f / MetadataProviders.Count;
				progress.Report(percent);
			}
			progress.Report(100);
		}
	}
}