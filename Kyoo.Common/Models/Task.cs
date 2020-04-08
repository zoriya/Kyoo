using System;
using System.Threading;
using System.Threading.Tasks;

namespace Kyoo.Models
{
	public interface ITask
	{
		public string Slug { get; }
		public string Name { get; }
		public string Description { get; }
		public string HelpMessage { get; }
		public bool RunOnStartup { get; }
		public int Priority { get; }
		public Task Run(IServiceProvider serviceProvider, CancellationToken cancellationToken, string arguments = null);
	}
}