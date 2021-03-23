using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;

namespace Kyoo.Controllers
{
	public class FileManager : IFileManager
	{
		private FileExtensionContentTypeProvider _provider;

		private string _GetContentType(string path)
		{
			if (_provider == null)
			{
				_provider = new FileExtensionContentTypeProvider();
				_provider.Mappings[".mkv"] = "video/x-matroska";
				_provider.Mappings[".ass"] = "text/x-ssa";
				_provider.Mappings[".srt"] = "application/x-subrip";
			}

			if (_provider.TryGetContentType(path, out string contentType))
				return contentType;
			throw new NotImplementedException($"Can't get the content type of the file at: {path}");
		}
		
		// TODO add a way to force content type 
		public IActionResult FileResult(string path, bool range)
		{
			if (path == null)
				return new NotFoundResult();
			if (!File.Exists(path))
				return new NotFoundResult();
			return new PhysicalFileResult(Path.GetFullPath(path), _GetContentType(path))
			{
				EnableRangeProcessing = range
			};
		}

		public StreamReader GetReader(string path)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			return new StreamReader(path);
		}

		public Task<ICollection<string>> ListFiles(string path)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			return Task.FromResult<ICollection<string>>(Directory.GetFiles(path));
		}

		public Task<bool> Exists(string path)
		{
			return Task.FromResult(File.Exists(path));
		}
		
		public string GetExtraDirectory(Show show)
		{
			string path = Path.Combine(show.Path, "Extra");
			Directory.CreateDirectory(path);
			return path;
		}
		
		public string GetExtraDirectory(Season season)
		{
			if (season.Show == null)
				throw new NotImplementedException("Can't get season's extra directory when season.Show == null.");
			// TODO use a season.Path here.
			string path = Path.Combine(season.Show.Path, "Extra");
			Directory.CreateDirectory(path);
			return path;
		}
		
		public string GetExtraDirectory(Episode episode)
		{
			string path = Path.Combine(Path.GetDirectoryName(episode.Path)!, "Extra");
			Directory.CreateDirectory(path);
			return path;
		}
	}
}