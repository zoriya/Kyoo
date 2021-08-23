using System.Threading.Tasks;
using Autofac;

namespace Kyoo.WindowsHost
{
	public static class Program
	{
		/// <summary>
		/// The main entry point for the application that overrides the default host (<see cref="Kyoo.Program"/>).
		/// It adds a system trait for windows and since the host is build as a windows executable instead of a console
		/// app, the console is not showed.
		/// </summary>
		public static Task Main(string[] args)
		{
			Application application = new();
			return application.Start(args, builder =>
			{
				builder.RegisterType<SystemTrait>().As<IStartable>().SingleInstance();
			});
		}
	}
}