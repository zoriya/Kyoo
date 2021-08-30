using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Autofac;
using Autofac.Extensions.DependencyInjection;
using JetBrains.Annotations;
using Kyoo.Abstractions.Controllers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Win32;
using Serilog;
using Serilog.Templates;
using Serilog.Templates.Themes;
using ILogger = Serilog.ILogger;

namespace Kyoo
{
	public class Application : IApplication
	{
		/// <summary>
		/// The path to the data directory.
		/// </summary>
		private string _dataDir;

		/// <summary>
		/// Should the application restart after a shutdown?
		/// </summary>
		private bool _shouldRestart;
		
		/// <summary>
		/// The cancellation token source used to allow the app to be shutdown or restarted.
		/// </summary>
		private CancellationTokenSource _tokenSource;

		/// <summary>
		/// The environment in witch Kyoo will run (ether "Production" or "Development"). 
		/// </summary>
		private readonly string _environment;

		
		/// <summary>
		/// Create a new <see cref="Application"/> that will use the specified environment.
		/// </summary>
		/// <param name="environment">The environment to run in.</param>
		public Application(string environment)
		{
			_environment = environment;
		}


		/// <summary>
		/// Start the application with the given console args.
		/// This is generally called from the Main entrypoint of Kyoo.
		/// </summary>
		/// <param name="args">The console arguments to use for kyoo.</param>
		/// <returns>A task representing the whole process</returns>
		public Task Start(string[] args)
		{
			return Start(args, _ => { });
		}

		/// <summary>
		/// Start the application with the given console args.
		/// This is generally called from the Main entrypoint of Kyoo.
		/// </summary>
		/// <param name="args">The console arguments to use for kyoo.</param>
		/// <param name="configure">A custom action to configure the container before the start</param>
		/// <returns>A task representing the whole process</returns>
		public async Task Start(string[] args, Action<ContainerBuilder> configure)
		{
			_dataDir = _SetupDataDir(args);
			
			LoggerConfiguration config = new();
			_ConfigureLogging(config, null);
			Log.Logger = config.CreateBootstrapLogger()
				.ForContext<Application>();

			AppDomain.CurrentDomain.ProcessExit += (_, _) => Log.CloseAndFlush();
			AppDomain.CurrentDomain.UnhandledException += (_, ex) 
				=> Log.Fatal(ex.ExceptionObject as Exception, "Unhandled exception");
			
			do
			{
				IHost host = _CreateWebHostBuilder(args)
					.ConfigureContainer(configure)
					.Build();
				Log.Logger = host.Services.GetRequiredService<ILogger>().ForContext<Application>();
				
				_tokenSource = new CancellationTokenSource();
				await _StartWithHost(host, _tokenSource.Token);
			} 
			while (_shouldRestart);
		}
		
		/// <inheritdoc />
		public void Shutdown()
		{
			_shouldRestart = false;
			_tokenSource.Cancel();
		}

		/// <inheritdoc />
		public void Restart()
		{
			_shouldRestart = true;
			_tokenSource.Cancel();
		}

		/// <inheritdoc />
		public string GetDataDirectory()
		{
			return _dataDir;
		}


		/// <inheritdoc />
		public string GetConfigFile()
		{
			return "./settings.json";
		}

		/// <summary>
		/// Parse the data directory from environment variables and command line arguments, create it if necessary.
		/// Set the current directory to said data folder and place a default configuration file if it does not already
		/// exists. 
		/// </summary>
		/// <param name="args">The command line arguments</param>
		/// <returns>The current data directory.</returns>
		private string _SetupDataDir(string[] args)
		{
			Dictionary<string, string> registry = new();

			if (OperatingSystem.IsWindows())
			{
				object dataDir = Registry.GetValue(@"HKEY_LOCAL_MACHINE\Software\SDG\Kyoo\Settings", "DataDir", null)
					?? Registry.GetValue(@"HKEY_CURRENT_USER\Software\SDG\Kyoo\Settings", "DataDir", null);
				if (dataDir is string data)
					registry.Add("DataDir", data);
			}

			IConfiguration parsed = new ConfigurationBuilder()
				.AddInMemoryCollection(registry)
				.AddEnvironmentVariables()
				.AddEnvironmentVariables("KYOO_")
				.AddCommandLine(args)
				.Build();

			string path = parsed.GetValue<string>("datadir") 
				?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Kyoo");

			if (!Directory.Exists(path))
				Directory.CreateDirectory(path);
			Environment.CurrentDirectory = path;

			if (!File.Exists(GetConfigFile()))
				File.Copy(Path.Join(AppDomain.CurrentDomain.BaseDirectory, GetConfigFile()),
					GetConfigFile());
			
			return path;
		}

		/// <summary>
		/// Start the given host and log failing exceptions.
		/// </summary>
		/// <param name="host">The host to start.</param>
		/// <param name="cancellationToken">A token to allow one to stop the host.</param>
		private async Task _StartWithHost(IHost host, CancellationToken cancellationToken)
		{
			try
			{
				Log.Information("Running as {Name}", Environment.UserName);
				Log.Information("Data directory: {DataDirectory}", GetDataDirectory());
				await host.RunAsync(cancellationToken);
			}
			catch (Exception ex)
			{
				Log.Fatal(ex, "Unhandled exception");
			}
		}

		/// <summary>
		/// Create a a web host
		/// </summary>
		/// <param name="args">Command line parameters that can be handled by kestrel</param>
		/// <returns>A new web host instance</returns>
		private IHostBuilder _CreateWebHostBuilder(string[] args)
		{
			IConfiguration configuration = _SetupConfig(new ConfigurationBuilder(), args).Build();

			return new HostBuilder()
				.UseServiceProviderFactory(new AutofacServiceProviderFactory())
				.UseContentRoot(AppDomain.CurrentDomain.BaseDirectory)
				.UseEnvironment(_environment)
				.ConfigureAppConfiguration(x => _SetupConfig(x, args))
				.UseSerilog((host, builder) => _ConfigureLogging(builder, host.Configuration))
				.ConfigureServices(x => x.AddRouting())
				.ConfigureContainer<ContainerBuilder>(x =>
				{
					x.RegisterInstance(this).As<IApplication>().SingleInstance().ExternallyOwned();
				})
				.ConfigureWebHost(x => x
					.UseKestrel(options => { options.AddServerHeader = false; })
					.UseIIS()
					.UseIISIntegration()
					.UseUrls(configuration.GetValue<string>("basics:url"))
					.UseStartup(host => PluginsStartup.FromWebHost(host, new LoggerFactory().AddSerilog()))
				);
		}
		
		/// <summary>
		/// Register settings.json, environment variables and command lines arguments as configuration.
		/// </summary>
		/// <param name="builder">The configuration builder to use</param>
		/// <param name="args">The command line arguments</param>
		/// <returns>The modified configuration builder</returns>
		private IConfigurationBuilder _SetupConfig(IConfigurationBuilder builder, string[] args)
		{
			return builder.SetBasePath(GetDataDirectory())
				.AddJsonFile(Path.Join(AppDomain.CurrentDomain.BaseDirectory, GetConfigFile()), false, true)
				.AddJsonFile(GetConfigFile(), false, true)
				.AddEnvironmentVariables()
				.AddEnvironmentVariables("KYOO_")
				.AddCommandLine(args);
		}
		
		/// <summary>
		/// Configure the logging.
		/// </summary>
		/// <param name="builder">The logger builder to configure.</param>
		/// <param name="configuration">The configuration to read settings from.</param>
		private void _ConfigureLogging(LoggerConfiguration builder, [CanBeNull] IConfiguration configuration)
		{
			if (configuration != null)
			{
				try
				{
					builder.ReadFrom.Configuration(configuration, "logging");
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
					path: Path.Combine(GetDataDirectory(), "logs", "log-.log"),
					formatter: new ExpressionTemplate(template),
					rollingInterval: RollingInterval.Day,
					rollOnFileSizeLimit: true
				)
				.Enrich.WithThreadId()
				.Enrich.FromLogContext();
		}
	}
}