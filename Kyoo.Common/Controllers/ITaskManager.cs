namespace Kyoo.Controllers
{
	public interface ITaskManager
	{
		bool StartTask(string taskSlug, string arguments = null);
		
		void ReloadTask();
	}
}