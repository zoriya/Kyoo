using System.IO;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Controllers
{
	public interface IFileManager
	{
		public IActionResult FileResult([NotNull] string path, bool rangeSupport = false);

		public StreamReader GetReader([NotNull] string path);
		// TODO implement a List for directorys, a Exist to check existance and all.
		// TODO replace every use of System.IO with this to allow custom paths (like uptobox://path)
		// TODO find a way to handle Transmux/Transcode with this system.
	}
}