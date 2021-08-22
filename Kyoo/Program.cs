using System;
using System.IO;
using System.Threading.Tasks;
using Autofac.Extensions.DependencyInjection;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;
using Serilog.Templates;
using Serilog.Templates.Themes;
using SEnvironment = System.Environment;

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
		private const string Environment = "Development";
#else
		private const string Environment = "Production";
#endif

		/// <summary>
		/// Initialize the bootstrap logger to use it anywhere. This is done here so it is called before any method,
		/// even if the <see cref="Main"/> is not used and this binary is used as a dll.
		/// </summary>
		static Program()
		{
			LoggerConfiguration config = new();
			_ConfigureLogging(null, config);
			Log.Logger = config.CreateBootstrapLogger().ForContext<Application>();

			AppDomain.CurrentDomain.ProcessExit += (_, _) => Log.CloseAndFlush();
		}
		
		/// <summary>
		/// Main function of the program
		/// </summary>
		/// <param name="args">Command line arguments</param>
		public static Task Main(string[] args)
		{
			SetupDataDir(args);
			return StartWithHost(CreateWebHostBuilder(args).Build());
		}

		/// <summary>
		/// Start the given host and log failing exceptions.
		/// </summary>
		/// <param name="host">The host to start.</param>
		public static async Task StartWithHost(IHost host)
		{
			try
			{
				host.Services.GetRequiredService<ILogger<Application>>()
					.LogInformation("Running as {Name}", System.Environment.UserName);
				await host.RunAsync();
			}
			catch (Exception ex)
			{
				host.Services.GetRequiredService<ILogger<Application>>().LogCritical(ex, "Unhandled exception");
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
			return builder.SetBasePath(System.Environment.CurrentDirectory)
				.AddJsonFile(Path.Join(AppDomain.CurrentDomain.BaseDirectory, JsonConfigPath), false, true)
				.AddJsonFile(JsonConfigPath, false, true)
				.AddEnvironmentVariables()
				.AddEnvironmentVariables("KYOO_")
				.AddCommandLine(args);
		}

		/// <summary>
		/// Configure the logging.
		/// </summary>
		/// <param name="context">The host context that contains the configuration</param>
		/// <param name="builder">The logger builder to configure.</param>
		private static void _ConfigureLogging([CanBeNull] HostBuilderContext context, LoggerConfiguration builder)
		{
			if (context != null)
			{
				try
				{
					builder.ReadFrom.Configuration(context.Configuration, "logging");
				}
				catch (Exception ex)
				{
					Log.Fatal(ex, "Could not read serilog configuration");
				}
			}

			const string template =
				"[{@t:HH:mm:ss} {@l:u3} {Substring(SourceContext, LastIndexOf(SourceContext, '.') + 1), 15} "
				+ "({@i:0000000000})] {@m}{#if not EndsWith(@m, '\n')}\n{#end}{@x}";

			builder
				.WriteTo.Console(new ExpressionTemplate(template, theme: TemplateTheme.Code))
				.WriteTo.Debug()
				.WriteTo.File(
					path: "logs/log-.log",
					formatter: new ExpressionTemplate(template),
					rollingInterval: RollingInterval.Day,
					rollOnFileSizeLimit: true
				)
				.Enrich.WithThreadId()
				.Enrich.FromLogContext();
		}

		/// <summary>
		/// Create a a web host
		/// </summary>
		/// <param name="args">Command line parameters that can be handled by kestrel</param>
		/// <returns>A new web host instance</returns>
		public static IHostBuilder CreateWebHostBuilder(string[] args)
		{
			IConfiguration configuration = SetupConfig(new ConfigurationBuilder(), args).Build();

			return new HostBuilder()
				.UseServiceProviderFactory(new AutofacServiceProviderFactory())
				.UseContentRoot(AppDomain.CurrentDomain.BaseDirectory)
				.UseEnvironment(Environment)
				.ConfigureAppConfiguration(x => SetupConfig(x, args))
				.UseSerilog(_ConfigureLogging)
				.ConfigureServices(x => x.AddRouting())
				.ConfigureWebHost(x => x
					.UseKestrel(options => { options.AddServerHeader = false; })
					.UseIIS()
					.UseIISIntegration()
					.UseUrls(configuration.GetValue<string>("basics:url"))
					.UseStartup(host => PluginsStartup.FromWebHost(host, new LoggerFactory().AddSerilog()))
				);
		}

		/// <summary>
		/// Parse the data directory from environment variables and command line arguments, create it if necessary.
		/// Set the current directory to said data folder and place a default configuration file if it does not already
		/// exists. 
		/// </summary>
		/// <param name="args">The command line arguments</param>
		public static void SetupDataDir(string[] args)
		{
			IConfiguration parsed = new ConfigurationBuilder()
				.AddEnvironmentVariables()
				.AddEnvironmentVariables("KYOO_")
				.AddCommandLine(args)
				.Build();

			string path = parsed.GetValue<string>("data_dir");
			if (path == null)
				path = Path.Combine(SEnvironment.GetFolderPath(SEnvironment.SpecialFolder.LocalApplicationData), "Kyoo");

			if (!Directory.Exists(path))
				Directory.CreateDirectory(path);
			SEnvironment.CurrentDirectory = path;

			if (!File.Exists(JsonConfigPath))
				File.Copy(Path.Join(AppDomain.CurrentDomain.BaseDirectory, JsonConfigPath), JsonConfigPath);
		}
	}
	
	/// <summary>
	/// An useless class only used to have a logger in the main.
	/// </summary>
	internal class Application {}
}
