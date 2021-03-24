using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Models;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Controllers
{
	public interface IFileManager
	{
		public IActionResult FileResult([CanBeNull] string path, bool rangeSupport = false);

		public StreamReader GetReader([NotNull] string path);

		public Task<ICollection<string>> ListFiles([NotNull] string path);

		public Task<bool> Exists([NotNull] string path);
		// TODO find a way to handle Transmux/Transcode with this system.

		public string GetExtraDirectory(Show show);
		
		public string GetExtraDirectory(Season season);
		
		public string GetExtraDirectory(Episode episode);
	}
}