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
using System.Collections.Generic;
using Autofac;
using Kyoo.Abstractions;
using Kyoo.Abstractions.Controllers;
using Kyoo.TheTvdb.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
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
		public string Name => "TVDB";

		/// <inheritdoc />
		public string Description => "A metadata provider for The TVDB.";

		/// <inheritdoc />
		public bool Enabled => !string.IsNullOrEmpty(_configuration.GetValue<string>("tvdb:apikey"));

		/// <inheritdoc />
		public Dictionary<string, Type> Configuration => new()
		{
			{ TvdbOption.Path, typeof(TvdbOption) }
		};

		/// <summary>
		/// The configuration used to check if the api key is present or not.
		/// </summary>
		private readonly IConfiguration _configuration;

		/// <summary>
		/// Create a new <see cref="PluginTvdb"/>.
		/// </summary>
		/// <param name="configuration">The configuration used to check if the api key is present or not.</param>
		/// <param name="logger">The logger used to warn when the api key is not present.</param>
		public PluginTvdb(IConfiguration configuration, ILogger<PluginTvdb> logger)
		{
			_configuration = configuration;
			if (!Enabled)
			{
				logger.LogWarning("No API key configured for TVDB provider. " +
					"To enable TVDB, specify one in the setting TVDB:APIKEY ");
			}
		}

		/// <inheritdoc />
		public void Configure(ContainerBuilder builder)
		{
			builder.RegisterType<TvDbClient>().As<ITvDbClient>();
			builder.RegisterProvider<ProviderTvdb>();
		}
	}
}
