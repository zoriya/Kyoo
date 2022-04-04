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
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Core.Models.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Options;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A <see cref="IFileSystem"/> for the local filesystem (using System.IO).
	/// </summary>
	[FileSystemMetadata(new[] { "", "file" }, StripScheme = true)]
	public class LocalFileSystem : IFileSystem
	{
		/// <summary>
		/// An extension provider to get content types from files extensions.
		/// </summary>
		private readonly IContentTypeProvider _provider;

		/// <summary>
		/// The transcoder of local files.
		/// </summary>
		private readonly ITranscoder _transcoder;

		/// <summary>
		/// Options to check if the metadata should be kept in the show directory or in a kyoo's directory.
		/// </summary>
		private readonly IOptionsMonitor<BasicOptions> _options;

		/// <summary>
		/// Create a new <see cref="LocalFileSystem"/> with the specified options.
		/// </summary>
		/// <param name="options">The options to use.</param>
		/// <param name="provider">An extension provider to get content types from files extensions.</param>
		/// <param name="transcoder">The transcoder of local files.</param>
		public LocalFileSystem(IOptionsMonitor<BasicOptions> options,
			IContentTypeProvider provider,
			ITranscoder transcoder)
		{
			_options = options;
			_provider = provider;
			_transcoder = transcoder;
		}

		/// <summary>
		/// Get the content type of a file using it's extension.
		/// </summary>
		/// <param name="path">The path of the file</param>
		/// <exception cref="NotImplementedException">The extension of the file is not known.</exception>
		/// <returns>The content type of the file</returns>
		private string _GetContentType(string path)
		{
			if (_provider.TryGetContentType(path, out string contentType))
				return contentType;
			throw new NotImplementedException($"Can't get the content type of the file at: {path}");
		}

		/// <inheritdoc />
		public IActionResult FileResult(string path, bool rangeSupport = false, string type = null)
		{
			if (path == null)
				return new NotFoundResult();
			if (!File.Exists(path))
				return new NotFoundResult();
			return new PhysicalFileResult(Path.GetFullPath(path), type ?? _GetContentType(path))
			{
				EnableRangeProcessing = rangeSupport
			};
		}

		/// <inheritdoc />
		public Task<Stream> GetReader(string path)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			return Task.FromResult<Stream>(File.OpenRead(path));
		}

		/// <inheritdoc />
		public Task<Stream> GetReader(string path, AsyncRef<string> mime)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			_provider.TryGetContentType(path, out string mimeValue);
			mime.Value = mimeValue;
			return Task.FromResult<Stream>(File.OpenRead(path));
		}

		/// <inheritdoc />
		public Task<Stream> NewFile(string path)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			return Task.FromResult<Stream>(File.Create(path));
		}

		/// <inheritdoc />
		public Task<string> CreateDirectory(string path)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			Directory.CreateDirectory(path);
			return Task.FromResult(path);
		}

		/// <inheritdoc />
		public string Combine(params string[] paths)
		{
			return Path.Combine(paths);
		}

		/// <inheritdoc />
		public Task<ICollection<string>> ListFiles(string path, SearchOption options = SearchOption.TopDirectoryOnly)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			string[] ret = Directory.Exists(path)
				? Directory.GetFiles(path, "*", options)
				: Array.Empty<string>();
			return Task.FromResult<ICollection<string>>(ret);
		}

		/// <inheritdoc />
		public Task<bool> Exists(string path)
		{
			return Task.FromResult(File.Exists(path) || Directory.Exists(path));
		}

		/// <inheritdoc />
		public Task<string> GetExtraDirectory<T>(T resource)
		{
			if (!_options.CurrentValue.MetadataInShow)
				return Task.FromResult<string>(null);
			return Task.FromResult(resource switch
			{
				Show show => Combine(show.Path, "Extra"),
				Season season => Combine(season.Show.Path, "Extra"),
				// TODO: extras should not be on the same directory for every episodes/seasons/tracks. If this is fixed, fonts handling will break.
				Episode episode => Combine(episode.Show.Path, "Extra"),
				Track track => Combine(track.Episode.Show.Path, "Extra"),
				_ => null
			});
		}

		/// <inheritdoc />
		public Task<ICollection<Track>> ExtractInfos(Episode episode, bool reExtract)
		{
			return _transcoder.ExtractInfos(episode, reExtract);
		}

		/// <inheritdoc />
		public IActionResult Transmux(Episode episode)
		{
			return _transcoder.Transmux(episode);
		}
	}
}
