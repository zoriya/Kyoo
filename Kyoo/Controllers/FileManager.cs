using System;
using System.IO;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;

namespace Kyoo.Controllers
{
	public class FileManager : ControllerBase, IFileManager
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
			return "video/mp4";
		}
		
		public IActionResult FileResult(string path, bool range)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			if (!System.IO.File.Exists(path))
				return NotFound();
			return PhysicalFile(path, _GetContentType(path), range);
		}

		public StreamReader GetReader(string path)
		{
			if (path == null)
				throw new ArgumentNullException(nameof(path));
			return new StreamReader(path);
		}
	}
}