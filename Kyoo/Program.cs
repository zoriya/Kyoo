using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;

namespace Kyoo
{
	public class Program
	{
		public static async Task Main(string[] args)
		{
			Console.WriteLine($"Running as: {Environment.UserName}");
			await CreateWebHostBuilder(args).Build().RunAsync();
		}

		public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
			WebHost.CreateDefaultBuilder(args)
				.UseKestrel(config => { config.AddServerHeader = false; })
				.UseUrls("http://*:5000")
				.UseStartup<Startup>();
	}
}
