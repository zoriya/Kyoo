using System.Threading.Tasks;
using Kyoo.Controllers;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Kyoo
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            IWebHost host = CreateWebHostBuilder(args).Build();

            using (IServiceScope serviceScope = host.Services.CreateScope())
            {
                IPluginManager pluginManager = serviceScope.ServiceProvider.GetService<IPluginManager>();
                pluginManager.ReloadPlugins();

                ICrawler crawler = serviceScope.ServiceProvider.GetService<ICrawler>();
                crawler.Start();
            }
            await host.RunAsync();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .UseKestrel((config) => { config.AddServerHeader = false; })
                .UseUrls("http://*:5000")
                .UseStartup<Startup>();
    }
}
