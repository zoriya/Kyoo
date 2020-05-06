using Kyoo.Controllers;
using Kyoo.Models;

namespace Kyoo.Tasks
{
	public static class CoreTaskHolder
	{
		public static readonly ITask[] Tasks =
		{
			new CreateDatabase(),
			new PluginLoader(),
			new Crawler(),
			new MetadataLoader(),
			new ReScan()
		};
	}
}