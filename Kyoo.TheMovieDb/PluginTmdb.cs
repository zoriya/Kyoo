using Autofac;
using Kyoo.Controllers;
using Kyoo.Models.Attributes;
using Kyoo.TheMovieDb.Models;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.TheMovieDb
{
	/// <summary>
	/// A plugin that add a <see cref="IMetadataProvider"/> for TheMovieDB.
	/// </summary>
	public class PluginTmdb : IPlugin
	{
		/// <inheritdoc />
		public string Slug => "the-moviedb";
		
		/// <inheritdoc />
		public string Name => "TheMovieDb Provider";
		
		/// <inheritdoc />
		public string Description => "A metadata provider for TheMovieDB.";


		/// <summary>
		/// The configuration to use.
		/// </summary>
		private readonly IConfiguration _configuration;
		
		/// <summary>
		/// The configuration manager used to register typed/untyped implementations.
		/// </summary>
		[Injected] public IConfigurationManager ConfigurationManager { private get; set; }
		
		
		/// <summary>
		/// Create a new tmdb module instance and use the given configuration.
		/// </summary>
		/// <param name="configuration">The configuration to use</param>
		public PluginTmdb(IConfiguration configuration)
		{
			_configuration = configuration;
		}
		
		
		/// <inheritdoc />
		public void Configure(ContainerBuilder builder)
		{
			builder.RegisterProvider<TheMovieDbProvider>();
		}
		
		/// <inheritdoc />
		public void Configure(IServiceCollection services)
		{
			services.Configure<TheMovieDbOptions>(_configuration.GetSection(TheMovieDbOptions.Path));
		}

		/// <inheritdoc />
		public void ConfigureAspNet(IApplicationBuilder app)
		{
			ConfigurationManager.AddTyped<TheMovieDbOptions>(TheMovieDbOptions.Path);
		}
	}
}