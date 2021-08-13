using System;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Threading.Tasks;
using Autofac.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

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
		/// Main function of the program
		/// </summary>
		/// <param name="args">Command line arguments</param>
		[SuppressMessage("ReSharper", "ConditionIsAlwaysTrueOrFalse")]
		public static async Task Main(string[] args)
		{
			if (!File.Exists(JsonConfigPath))
				File.Copy(Path.Join(AppDomain.CurrentDomain.BaseDirectory, JsonConfigPath), JsonConfigPath);
			
			IHostBuilder builder = CreateWebHostBuilder(args);
			
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
			{
				Console.WriteLine(
					$"Invalid ENVIRONMENT variable. Supported values are \"debug\" and \"prod\". Ignoring...");
			}

			#if DEBUG
				debug ??= true;
			#endif

			if (debug != null)
				builder = builder.UseEnvironment(debug == true ? "Development" : "Production");

			try
			{
				Console.WriteLine($"Running as {Environment.UserName}.");
				await builder.Build().RunAsync();
			}
			catch (Exception ex)
			{
				await Console.Error.WriteLineAsync($"Unhandled exception: {ex}");
			}
		}

		/// <summary>
		/// Register settings.json, environment variables and command lines arguments as configuration.
		/// </summary>
		/// <param name="builder">The configuration builder to use</param>
		/// <param name="args">The command line arguments</param>
		/// <returns>The modified configuration builder</returns>
		private static IConfigurationBuilder SetupConfig(IConfigurationBuilder builder, string[] args)
		{
			return builder.SetBasePath(Environment.CurrentDirectory)
				.AddJsonFile(JsonConfigPath, false, true)
				.AddEnvironmentVariables()
				.AddCommandLine(args);
		}

		/// <summary>
		/// Configure the logging.
		/// </summary>
		/// <param name="context">The host context that contains the configuration</param>
		/// <param name="builder">The logger builder to configure.</param>
		private static void _ConfigureLogging(HostBuilderContext context, ILoggingBuilder builder)
		{
			builder.AddConfiguration(context.Configuration.GetSection("logging"))
				.AddSimpleConsole(x =>
				{
					x.TimestampFormat = "[hh:mm:ss] ";
				})
				.AddDebug()
				.AddEventSourceLogger();
		}

		/// <summary>
		/// Create a a web host
		/// </summary>
		/// <param name="args">Command line parameters that can be handled by kestrel</param>
		/// <param name="loggingConfiguration">
		/// An action to configure the logging. If it is null, <see cref="_ConfigureLogging"/> will be used.
		/// </param>
		/// <returns>A new web host instance</returns>
		public static IHostBuilder CreateWebHostBuilder(string[] args,
			Action<HostBuilderContext, ILoggingBuilder> loggingConfiguration = null)
		{
			IConfiguration configuration = SetupConfig(new ConfigurationBuilder(), args).Build();
			loggingConfiguration ??= _ConfigureLogging;

			return new HostBuilder()
				.UseServiceProviderFactory(new AutofacServiceProviderFactory())
				.UseContentRoot(AppDomain.CurrentDomain.BaseDirectory)
				.ConfigureAppConfiguration(x => SetupConfig(x, args))
				.ConfigureLogging(loggingConfiguration)
				.ConfigureServices(x => x.AddRouting())
				.ConfigureWebHost(x => x
					.UseKestrel(options => { options.AddServerHeader = false; })
					.UseIIS()
					.UseIISIntegration()
					.UseUrls(configuration.GetValue<string>("basics:url"))
					.UseStartup(host => PluginsStartup.FromWebHost(host, loggingConfiguration))
				);
		}
	}
}
