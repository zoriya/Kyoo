using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.VisualBasic.FileIO;

namespace Kyoo
{
	/// <summary>
	/// Program entrypoint.
	/// </summary>
	public static class Program
	{
		/// <summary>
		/// Main function of the program
		/// </summary>
		/// <param name="args">Command line arguments</param>
		public static async Task Main(string[] args)
		{
			if (args.Length > 0)
				FileSystem.CurrentDirectory = args[0];
			if (!File.Exists("./appsettings.json"))
				File.Copy(Path.Join(AppDomain.CurrentDomain.BaseDirectory, "appsettings.json"), "appsettings.json");


			bool? debug = Environment.GetEnvironmentVariable("ENVIRONMENT")?.ToLowerInvariant() switch
			{
				"d" => true,
				"dev" => true,
				"debug" => true,
				"development" => true,
				"p" => false,
				"prod" => false,
				"production" => false,
				_ => null
			};

			if (debug == null && Environment.GetEnvironmentVariable("ENVIRONMENT") != null)
				Console.WriteLine($"Invalid ENVIRONMENT variable. Supported values are \"debug\" and \"prod\". Ignoring...");
			#if DEBUG
				debug ??= true;
			#endif

			Console.WriteLine($"Running as {Environment.UserName}.");
			IWebHostBuilder host = CreateWebHostBuilder(args);
			if (debug != null)
				host = host.UseEnvironment(debug == true ? "Development" : "Production");
			await host.Build().RunAsync();
		}

		/// <summary>
		/// Createa a web host
		/// </summary>
		/// <param name="args">Command line parameters that can be handled by kestrel</param>
		/// <returns>A new web host instance</returns>
		private static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
			WebHost.CreateDefaultBuilder(args)
				.UseKestrel(config => { config.AddServerHeader = false; })
				.UseUrls("http://*:5000")
				.UseStartup<Startup>();
	}
}
