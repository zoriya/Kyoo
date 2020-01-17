using System.Collections.Generic;

namespace Kyoo.Controllers
{
	public interface IPluginManager
	{
		public T GetPlugin<T>(string name);
		public IEnumerable<T> GetPlugins<T>();
		public void ReloadPlugins();
	}
}