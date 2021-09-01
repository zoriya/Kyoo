using System;
using System.Collections.Generic;
using Autofac;
using Kyoo.Abstractions;
using Kyoo.Abstractions.Controllers;
using Kyoo.TheMovieDb.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

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
		public string Name => "TheMovieDb";
		
		/// <inheritdoc />
		public string Description => "A metadata provider for TheMovieDB.";

		/// <inheritdoc />
		public bool Enabled => !string.IsNullOrEmpty(_configuration.GetValue<string>("the-moviedb:apikey"));

		/// <inheritdoc />
		public Dictionary<string, Type> Configuration => new()
		{
			{ TheMovieDbOptions.Path, typeof(TheMovieDbOptions) }
		};

		/// <summary>
		/// The configuration used to check if the api key is present or not.
		/// </summary>
		private readonly IConfiguration _configuration;

		/// <summary>
		/// Create a new <see cref="PluginTmdb"/>.
		/// </summary>
		/// <param name="configuration">The configuration used to check if the api key is present or not.</param>
		/// <param name="logger">The logger used to warn when the api key is not present.</param>
		public PluginTmdb(IConfiguration configuration, ILogger<PluginTmdb> logger)
		{
			_configuration = configuration;
			if (!Enabled)
				logger.LogWarning("No API key configured for TheMovieDB provider. " +
					"To enable TheMovieDB, specify one in the setting the-moviedb:APIKEY ");
		}

		/// <inheritdoc />
		public void Configure(ContainerBuilder builder)
		{
			builder.RegisterProvider<TheMovieDbProvider>();
		}
	}
}