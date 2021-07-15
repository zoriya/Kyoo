using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;

namespace Kyoo.Controllers
{
	/// <summary>
	/// A <see cref="IFileManager"/> for the local filesystem (using System.IO).
	/// </summary>
	public class FileManager : IFileManager
	{
		/// <summary>
		/// An extension provider to get content types from files extensions.
		/// </summary>
		private FileExtensionContentTypeProvider _provider;

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
		public IActionResult FileResult(string path, bool range = false, string type = null)
		{
			if (path == null)
				return new NotFoundResult();
			if (!File.Exists(path))
				return new NotFoundResult();
			return new PhysicalFileResult(Path.GetFullPath(path), type ?? _GetContentType(path))
			{
				EnableRangeProcessing = range
			};
		}

		/// <inheritdoc />
		public Stream GetReader(string path)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			return File.OpenRead(path);
		}

		/// <inheritdoc />
		public Stream NewFile(string path)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			return File.Create(path);
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
			return Task.FromResult(File.Exists(path));
		}
		
		/// <inheritdoc />
		public string GetExtraDirectory(Show show)
		{
			string path = Path.Combine(show.Path, "Extra");
			Directory.CreateDirectory(path);
			return path;
		}
		
		/// <inheritdoc />
		public string GetExtraDirectory(Season season)
		{
			if (season.Show == null)
				throw new NotImplementedException("Can't get season's extra directory when season.Show == null.");
			// TODO use a season.Path here.
			string path = Path.Combine(season.Show.Path, "Extra");
			Directory.CreateDirectory(path);
			return path;
		}
		
		/// <inheritdoc />
		public string GetExtraDirectory(Episode episode)
		{
			string path = Path.Combine(Path.GetDirectoryName(episode.Path)!, "Extra");
			Directory.CreateDirectory(path);
			return path;
		}
	}
}