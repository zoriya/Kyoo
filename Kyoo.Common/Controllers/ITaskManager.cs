using System.Collections.Generic;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public interface ITaskManager
	{
		bool StartTask(string taskSlug, string arguments = null);
		ITask GetRunningTask();
		void ReloadTask();
		IEnumerable<ITask> GetAllTasks();
	}
}