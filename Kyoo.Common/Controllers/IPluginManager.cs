using System.Collections.Generic;
using Kyoo.Models;

namespace Kyoo.Controllers
{
	public interface IPluginManager
	{
		public T GetPlugin<T>(string name);
		public IEnumerable<T> GetPlugins<T>();
		public IEnumerable<IPlugin> GetAllPlugins();
		public void ReloadPlugins();
	}
}