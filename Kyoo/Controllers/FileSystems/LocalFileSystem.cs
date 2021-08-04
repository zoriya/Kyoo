using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Kyoo.Common.Models.Attributes;
using Kyoo.Models;
using Kyoo.Models.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Options;

namespace Kyoo.Controllers
{
	/// <summary>
	/// A <see cref="IFileSystem"/> for the local filesystem (using System.IO).
	/// </summary>
	[FileSystemMetadata(new [] {"", "file"}, StripScheme = true)]
	public class LocalFileSystem : IFileSystem
	{
		/// <summary>
		/// An extension provider to get content types from files extensions.
		/// </summary>
		private FileExtensionContentTypeProvider _provider;

		/// <summary>
		/// Options to check if the metadata should be kept in the show directory or in a kyoo's directory.
		/// </summary>
		private readonly IOptionsMonitor<BasicOptions> _options;

		/// <summary>
		/// Create a new <see cref="LocalFileSystem"/> with the specified options.
		/// </summary>
		/// <param name="options">The options to use.</param>
		public LocalFileSystem(IOptionsMonitor<BasicOptions> options)
		{
			_options = options;
		}

		/// <summary>
		/// Get the content type of a file using it's extension.
		/// </summary>
		/// <param name="path">The path of the file</param>
		/// <exception cref="NotImplementedException">The extension of the file is not known.</exception>
		/// <returns>The content type of the file</returns>
		private string _GetContentType(string path)
		{
			if (_provider == null)
			{
				_provider = new FileExtensionContentTypeProvider();
				_provider.Mappings[".mkv"] = "video/x-matroska";
				_provider.Mappings[".ass"] = "text/x-ssa";
				_provider.Mappings[".srt"] = "application/x-subrip";
				_provider.Mappings[".m3u8"] = "application/x-mpegurl";
			}

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
				return null;
			return Task.FromResult(resource switch
			{
				Show show => Combine(show.Path, "Extra"),
				Season season => Combine(season.Show.Path, "Extra"),
				Episode episode => Combine(episode.Show.Path, "Extra"),
				Track track => Combine(track.Episode.Show.Path, "Extra"),
				_ => null
			});
		}
	}
}