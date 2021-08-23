using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;

namespace Kyoo
{
	/// <summary>
	/// Program entrypoint.
	/// </summary>
	public static class Program
	{
		/// <summary>
		/// The path of the json configuration of the application.
		/// </summary>
		public const string JsonConfigPath = "./settings.json";

		/// <summary>
		/// The string representation of the environment used in <see cref="IWebHostEnvironment"/>.
		/// </summary>
#if DEBUG
		public const string Environment = "Development";
#else
		public const string Environment = "Production";
#endif

		/// <summary>
		/// Main function of the program
		/// </summary>
		/// <param name="args">Command line arguments</param>
		public static Task Main(string[] args)
		{
			Application application = new();
			return application.Start(args);
		}
	}
}
