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
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Autofac.Features.Metadata;
using JetBrains.Annotations;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Core.Models.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kyoo.Host.Controllers
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
		/// Options to check if the metadata should be kept in the show directory or in a kyoo's directory.
		/// </summary>
		private readonly IOptionsMonitor<BasicOptions> _options;

		/// <summary>
		/// Create a new <see cref="FileSystemComposite"/> from a list of <see cref="IFileSystem"/> mapped to their
		/// metadata.
		/// </summary>
		/// <param name="fileSystems">The list of filesystem mapped to their metadata.</param>
		/// <param name="options">The options to use.</param>
		public FileSystemComposite(ICollection<Meta<Func<IFileSystem>, FileSystemMetadataAttribute>> fileSystems,
			IOptionsMonitor<BasicOptions> options)
		{
			_fileSystems = fileSystems;
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
					.SingleOrDefault(x => x.Metadata.Scheme.Contains(string.Empty));
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
		public Task<string> GetExtraDirectory<T>(T resource)
		{
			IFileSystem fs = _GetFileSystemForPath(_options.CurrentValue.MetadataPath, out string path);
			return fs.GetExtraDirectory(resource);
		}

		/// <inheritdoc />
		public Task<ICollection<Track>> ExtractInfos(Episode episode, bool reExtract)
		{
			IFileSystem fs = _GetFileSystemForPath(episode.Path, out string _);
			return fs.ExtractInfos(episode, reExtract);
		}

		/// <inheritdoc />
		public IActionResult Transmux(Episode episode)
		{
			IFileSystem fs = _GetFileSystemForPath(episode.Path, out string _);
			return fs.Transmux(episode);
		}
	}
}
