using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;

namespace Kyoo.Host.Console
{
	/// <summary>
	/// Program entrypoint.
	/// </summary>
	public static class Program
	{
		/// <summary>
		/// The string representation of the environment used in <see cref="IWebHostEnvironment"/>.
		/// </summary>
#if DEBUG
		private const string Environment = "Development";
#else
		private const string Environment = "Production";
#endif

		/// <summary>
		/// Main function of the program
		/// </summary>
		/// <param name="args">Command line arguments</param>
		public static Task Main(string[] args)
		{
			Application application = new(Environment);
			return application.Start(args);
		}
	}
}
