using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Autofac.Features.Metadata;
using JetBrains.Annotations;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models;
using Kyoo.Core.Models.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A composite that merge every <see cref="IFileSystem"/> available
	/// using <see cref="FileSystemMetadataAttribute"/>.
	/// </summary>
	public class FileSystemComposite : IFileSystem
	{
		/// <summary>
		/// The list of <see cref="IFileSystem"/> mapped to their metadata.
		/// </summary>
		private readonly ICollection<Meta<Func<IFileSystem>, FileSystemMetadataAttribute>> _fileSystems;

		/// <summary>
		/// The library manager used to load shows to retrieve their path
		/// (only if the option is set to metadata in show)
		/// </summary>
		private readonly ILibraryManager _libraryManager;

		/// <summary>
		/// Options to check if the metadata should be kept in the show directory or in a kyoo's directory.
		/// </summary>
		private readonly IOptionsMonitor<BasicOptions> _options;

		/// <summary>
		/// Create a new <see cref="FileSystemComposite"/> from a list of <see cref="IFileSystem"/> mapped to their
		/// metadata.
		/// </summary>
		/// <param name="fileSystems">The list of filesystem mapped to their metadata.</param>
		/// <param name="libraryManager">The library manager used to load shows to retrieve their path.</param>
		/// <param name="options">The options to use.</param>
		public FileSystemComposite(ICollection<Meta<Func<IFileSystem>, FileSystemMetadataAttribute>> fileSystems,
			ILibraryManager libraryManager,
			IOptionsMonitor<BasicOptions> options)
		{
			_fileSystems = fileSystems;
			_libraryManager = libraryManager;
			_options = options;
		}

		/// <summary>
		/// Retrieve the file system that should be used for a given path.
		/// </summary>
		/// <param name="path">
		/// The path that was requested.
		/// </param>
		/// <param name="usablePath">
		/// The path that the returned file system wants
		/// (respecting <see cref="FileSystemMetadataAttribute.StripScheme"/>).
		/// </param>
		/// <exception cref="ArgumentException">No file system was registered for the given path.</exception>
		/// <returns>The file system that should be used for a given path</returns>
		[NotNull]
		private IFileSystem _GetFileSystemForPath([NotNull] string path, [NotNull] out string usablePath)
		{
			Regex schemeMatcher = new(@"(.+)://(.*)", RegexOptions.Compiled);
			Match match = schemeMatcher.Match(path);

			if (!match.Success)
			{
				usablePath = path;
				Meta<Func<IFileSystem>, FileSystemMetadataAttribute> defaultFs = _fileSystems
					.SingleOrDefault(x => x.Metadata.Scheme.Contains(""));
				if (defaultFs == null)
					throw new ArgumentException($"No file system registered for the default scheme.");
				return defaultFs.Value.Invoke();
			}
			string scheme = match.Groups[1].Value;
			Meta<Func<IFileSystem>, FileSystemMetadataAttribute> ret = _fileSystems
				.SingleOrDefault(x => x.Metadata.Scheme.Contains(scheme));
			if (ret == null)
				throw new ArgumentException($"No file system registered for the scheme: {scheme}.");
			usablePath = ret.Metadata.StripScheme ? match.Groups[2].Value : path;
			return ret.Value.Invoke();
		}

		/// <inheritdoc />
		public IActionResult FileResult(string path, bool rangeSupport = false, string type = null)
		{
			if (path == null)
				return new NotFoundResult();
			return _GetFileSystemForPath(path, out string relativePath)
				.FileResult(relativePath, rangeSupport, type);
		}

		/// <inheritdoc />
		public Task<Stream> GetReader(string path)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			return _GetFileSystemForPath(path, out string relativePath)
				.GetReader(relativePath);
		}

		/// <inheritdoc />
		public Task<Stream> GetReader(string path, AsyncRef<string> mime)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			return _GetFileSystemForPath(path, out string relativePath)
				.GetReader(relativePath, mime);
		}

		/// <inheritdoc />
		public Task<Stream> NewFile(string path)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			return _GetFileSystemForPath(path, out string relativePath)
				.NewFile(relativePath);
		}

		/// <inheritdoc />
		public Task<string> CreateDirectory(string path)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			return _GetFileSystemForPath(path, out string relativePath)
				.CreateDirectory(relativePath);
		}

		/// <inheritdoc />
		public string Combine(params string[] paths)
		{
			return _GetFileSystemForPath(paths[0], out string relativePath)
				.Combine(paths[1..].Prepend(relativePath).ToArray());
		}

		/// <inheritdoc />
		public Task<ICollection<string>> ListFiles(string path, SearchOption options = SearchOption.TopDirectoryOnly)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			return _GetFileSystemForPath(path, out string relativePath)
				.ListFiles(relativePath, options);
		}

		/// <inheritdoc />
		public Task<bool> Exists(string path)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			return _GetFileSystemForPath(path, out string relativePath)
				.Exists(relativePath);
		}

		/// <inheritdoc />
		public async Task<string> GetExtraDirectory<T>(T resource)
		{
			switch (resource)
			{
				case Season season:
					await _libraryManager.Load(season, x => x.Show);
					break;
				case Episode episode:
					await _libraryManager.Load(episode, x => x.Show);
					break;
				case Track track:
					await _libraryManager.Load(track, x => x.Episode);
					await _libraryManager.Load(track.Episode, x => x.Show);
					break;
			}

			IFileSystem fs = resource switch
			{
				Show show => _GetFileSystemForPath(show.Path, out string _),
				Season season => _GetFileSystemForPath(season.Show.Path, out string _),
				Episode episode => _GetFileSystemForPath(episode.Show.Path, out string _),
				Track track => _GetFileSystemForPath(track.Episode.Show.Path, out string _),
				_ => _GetFileSystemForPath(_options.CurrentValue.MetadataPath, out string _)
			};
			string path = await fs.GetExtraDirectory(resource)
				?? resource switch
				{
					Season season => await GetExtraDirectory(season.Show),
					Episode episode => await GetExtraDirectory(episode.Show),
					Track track => await GetExtraDirectory(track.Episode),
					IResource res => Combine(_options.CurrentValue.MetadataPath,
						typeof(T).Name.ToLowerInvariant(), res.Slug),
					_ => Combine(_options.CurrentValue.MetadataPath, typeof(T).Name.ToLowerInvariant())
				};
			return await CreateDirectory(path);
		}
	}
}