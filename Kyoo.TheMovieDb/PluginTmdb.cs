using System;
using System.Collections.Generic;
using Autofac;
using Kyoo.Abstractions;
using Kyoo.Abstractions.Controllers;
using Kyoo.TheMovieDb.Models;

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
		
		/// <inheritdoc />
		public Dictionary<string, Type> Configuration => new()
		{
			{ TheMovieDbOptions.Path, typeof(TheMovieDbOptions) }
		};

		/// <inheritdoc />
		public void Configure(ContainerBuilder builder)
		{
			builder.RegisterProvider<TheMovieDbProvider>();
		}
	}
}