// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System;
using System.IO;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Autofac;
using Autofac.Extensions.DependencyInjection;
using Kyoo.Core;
using Kyoo.Meiliseach;
using Kyoo.Postgresql;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;
using Serilog.Events;
using Serilog.Templates;
using Serilog.Templates.Themes;
using ILogger = Serilog.ILogger;

namespace Kyoo.Host
{
	/// <summary>
	/// Hosts of kyoo (main functions) generally only create a new <see cref="Application"/>
	/// and return <see cref="Start(string[])"/>.
	/// </summary>
	public class Application
	{
		/// <summary>
		/// The environment in witch Kyoo will run (ether "Production" or "Development").
		/// </summary>
		private readonly string _environment;

		/// <summary>
		/// The logger used for startup and error messages.
		/// </summary>
		private ILogger _logger;

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
			IConfiguration parsed = _SetupConfig(new ConfigurationBuilder(), args).Build();
			string path = Path.GetFullPath(parsed.GetValue("DATADIR", "/kyoo"));
			if (!Directory.Exists(path))
				Directory.CreateDirectory(path);
			Environment.CurrentDirectory = path;

			LoggerConfiguration config = new();
			_ConfigureLogging(config);
			Log.Logger = config.CreateBootstrapLogger();
			_logger = Log.Logger.ForContext<Application>();

			AppDomain.CurrentDomain.ProcessExit += (_, _) => Log.CloseAndFlush();
			AppDomain.CurrentDomain.UnhandledException += (_, ex) =>
				Log.Fatal(ex.ExceptionObject as Exception, "Unhandled exception");

			IHost host = _CreateWebHostBuilder(args).ConfigureContainer(configure).Build();

			await using (AsyncServiceScope scope = host.Services.CreateAsyncScope())
			{
				PostgresModule.Initialize(scope.ServiceProvider);
				await MeilisearchModule.Initialize(scope.ServiceProvider);
			}

			await _StartWithHost(host);
		}

		/// <summary>
		/// Start the given host and log failing exceptions.
		/// </summary>
		/// <param name="host">The host to start.</param>
		/// <param name="cancellationToken">A token to allow one to stop the host.</param>
		private async Task _StartWithHost(IHost host, CancellationToken cancellationToken = default)
		{
			try
			{
				CoreModule.Services = host.Services;
				_logger.Information(
					"Version: {Version}",
					Assembly.GetExecutingAssembly().GetName().Version.ToString(3)
				);
				_logger.Information(
					"Data directory: {DataDirectory}",
					Environment.CurrentDirectory
				);
				await host.RunAsync(cancellationToken);
			}
			catch (Exception ex)
			{
				_logger.Fatal(ex, "Unhandled exception");
			}
		}

		/// <summary>
		/// Create a a web host
		/// </summary>
		/// <param name="args">Command line parameters that can be handled by kestrel</param>
		/// <returns>A new web host instance</returns>
		private IHostBuilder _CreateWebHostBuilder(string[] args)
		{
			return new HostBuilder()
				.UseServiceProviderFactory(new AutofacServiceProviderFactory())
				.UseContentRoot(AppDomain.CurrentDomain.BaseDirectory)
				.UseEnvironment(_environment)
				.ConfigureAppConfiguration(x => _SetupConfig(x, args))
				.UseSerilog((host, services, builder) => _ConfigureLogging(builder))
				.ConfigureServices(x => x.AddRouting())
				.ConfigureWebHost(x =>
					x.UseKestrel(options =>
						{
							options.AddServerHeader = false;
						})
						.UseIIS()
						.UseIISIntegration()
						.UseUrls(
							Environment.GetEnvironmentVariable("KYOO_BIND_URL") ?? "http://*:5000"
						)
						.UseStartup(host =>
							PluginsStartup.FromWebHost(host, new LoggerFactory().AddSerilog())
						)
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
			return builder
				.AddEnvironmentVariables()
				.AddEnvironmentVariables("KYOO_")
				.AddCommandLine(args);
		}

		/// <summary>
		/// Configure the logging.
		/// </summary>
		/// <param name="builder">The logger builder to configure.</param>
		private void _ConfigureLogging(LoggerConfiguration builder)
		{
			const string template =
				"[{@t:HH:mm:ss} {@l:u3} {Substring(SourceContext, LastIndexOf(SourceContext, '.') + 1), 25} "
				+ "({@i:D10})] {@m}{#if not EndsWith(@m, '\n')}\n{#end}{@x}";
			builder
				.MinimumLevel.Warning()
				.MinimumLevel.Override("Kyoo", LogEventLevel.Verbose)
				.MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Verbose)
				.MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Fatal)
				.WriteTo.Console(new ExpressionTemplate(template, theme: TemplateTheme.Code))
				.Enrich.WithThreadId()
				.Enrich.FromLogContext();
		}
	}
}
