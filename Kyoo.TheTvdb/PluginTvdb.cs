using System;
using System.Collections.Generic;
using Autofac;
using Kyoo.Abstractions;
using Kyoo.Abstractions.Controllers;
using Kyoo.TheTvdb.Models;
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
		public Dictionary<string, Type> Configuration => new()
		{
			{ TvdbOption.Path, typeof(TvdbOption) }
		};

		/// <inheritdoc />
		public void Configure(ContainerBuilder builder)
		{
			builder.RegisterType<TvDbClient>().As<ITvDbClient>();
			builder.RegisterProvider<ProviderTvdb>();
		}
	}
}