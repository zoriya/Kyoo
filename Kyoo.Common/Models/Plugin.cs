using System.Collections.Generic;

namespace Kyoo.Models
{
	public interface IPlugin
	{
		public string Name { get; }
		public IEnumerable<ITask> Tasks { get; }
	}
}