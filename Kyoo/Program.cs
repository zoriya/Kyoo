using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.VisualBasic.FileIO;

namespace Kyoo
{
	public static class Program
	{
		public static async Task Main(string[] args)
		{
			if (args.Length > 0)
				FileSystem.CurrentDirectory = args[0];
			if (!File.Exists("./appsettings.json"))
				File.Copy(Path.Join(AppDomain.CurrentDomain.BaseDirectory, "appsettings.json"), "appsettings.json");


			bool? debug = Environment.GetEnvironmentVariable("ENVIRONEMENT")?.ToLowerInvariant() switch
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

			if (debug == null && !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ENVIRONEMENT")))
				Console.WriteLine($"Invalid ENVIRONEMENT variable. Supported values are \"debug\" and \"prod\". Ignoring...");

			Console.WriteLine($"Running as {Environment.UserName}.");
			IWebHostBuilder host = CreateWebHostBuilder(args);
			if (debug != null)
				host = host.UseEnvironment(debug == true ? "Development" : "Production");
			await host.Build().RunAsync();
		}

		private static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
			WebHost.CreateDefaultBuilder(args)
				.UseKestrel(config => { config.AddServerHeader = false; })
				.UseUrls("http://*:5000")
				.UseStartup<Startup>();
	}
}
