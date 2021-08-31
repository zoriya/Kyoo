using System.Threading.Tasks;
using Autofac;
using Kyoo.Core;

namespace Kyoo.Host.WindowsTrait
{
	public static class Program
	{
		/// <summary>
		/// The string representation of the environment used in IWebHostEnvironment.
		/// </summary>
#if DEBUG
		private const string Environment = "Development";
#else
		private const string Environment = "Production";
#endif
		
		/// <summary>
		/// The main entry point for the application that overrides the default host.
		/// It adds a system trait for windows and since the host is build as a windows executable instead of a console
		/// app, the console is not showed.
		/// </summary>
		public static Task Main(string[] args)
		{
			Application application = new(Environment);
			return application.Start(args, builder =>
			{
				builder.RegisterType<SystemTrait>().As<IStartable>().SingleInstance();
			});
		}
	}
}