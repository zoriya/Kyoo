namespace Kyoo.Controllers
{
	public interface ITaskManager
	{
		bool StartTask(string taskSlug);
		
		void ReloadTask();
	}
}