using System.Threading.Tasks;
using Autofac;
using Microsoft.Extensions.Hosting;

namespace Kyoo.Host.Windows
{
	public static class Program
	{
		/// <summary>
		/// The main entry point for the application that overrides the default host (<see cref="Kyoo.Program"/>).
		/// It adds a system trait for windows and since the host is build as a windows executable instead of a console
		/// app, the console is not showed.
		/// </summary>
		public static async Task Main(string[] args)
		{
			Kyoo.Program.SetupDataDir(args);

			IHost host = Kyoo.Program.CreateWebHostBuilder(args)
				.ConfigureContainer<ContainerBuilder>(builder =>
				{
					builder.RegisterType<SystemTrait>().As<IStartable>().SingleInstance();
				})
				.Build();
			
			await Kyoo.Program.StartWithHost(host);
		}
	}
}