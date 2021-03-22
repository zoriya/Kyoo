using System;
using System.Collections.Generic;
using System.IO;
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
			}

			if (_provider.TryGetContentType(path, out string contentType))
				return contentType;
			throw new NotImplementedException($"Can't get the content type of the file at: {path}");
		}
		
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

		public string GetExtraDirectory(string showPath)
		{
			string path = Path.Combine(showPath, "Extra");
			Directory.CreateDirectory(path);
			return path;
		}

		public ICollection<string> ListFiles(string path)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			return Directory.GetFiles(path);
		}
	}
}