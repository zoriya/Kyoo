using System;
using System.Collections.Generic;
using Autofac;
using Kyoo.Authentication.Models;
using Kyoo.Controllers;
using Kyoo.Models.Attributes;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TvDbSharper;

namespace Kyoo.TheTvdb
{
	/// <summary>
	/// A plugin that add a <see cref="IMetadataProvider"/> for The TVDB.
	/// </summary>
	public class PluginTvdb : IPlugin
	{
		/// <inheritdoc />
		public string Slug => "the-tvdb";
		
		/// <inheritdoc />
		public string Name => "The TVDB Provider";
		
		/// <inheritdoc />
		public string Description => "A metadata provider for The TVDB.";
		
		/// <inheritdoc />
		public ICollection<Type> Provides => new []
		{
			typeof(IMetadataProvider)
		};
		
		/// <inheritdoc />
		public ICollection<ConditionalProvide> ConditionalProvides => ArraySegment<ConditionalProvide>.Empty;
		
		/// <inheritdoc />
		public ICollection<Type> Requires => ArraySegment<Type>.Empty;
		
		
		/// <summary>
		/// The configuration to use.
		/// </summary>
		private readonly IConfiguration _configuration;
		
		/// <summary>
		/// The configuration manager used to register typed/untyped implementations.
		/// </summary>
		[Injected] public IConfigurationManager ConfigurationManager { private get; set; }
		
		
		/// <summary>
		/// Create a new tvdb module instance and use the given configuration.
		/// </summary>
		/// <param name="configuration">The configuration to use</param>
		public PluginTvdb(IConfiguration configuration)
		{
			_configuration = configuration;
		}
		
		
		/// <inheritdoc />
		public void Configure(ContainerBuilder builder)
		{
			builder.RegisterType<TvDbClient>().As<ITvDbClient>();
			builder.RegisterProvider<ProviderTvdb>();
		}
		
		/// <inheritdoc />
		public void Configure(IServiceCollection services, ICollection<Type> availableTypes)
		{
			services.Configure<TvdbOption>(_configuration.GetSection(TvdbOption.Path));
		}

		/// <inheritdoc />
		public void ConfigureAspNet(IApplicationBuilder app)
		{
			ConfigurationManager.AddTyped<TvdbOption>(TvdbOption.Path);
		}
	}
}