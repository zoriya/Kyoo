using System;
using System.Collections.Generic;
using Kyoo.Controllers;
using Microsoft.Extensions.DependencyInjection;

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
		
		
		/// <inheritdoc />
		public void Configure(IServiceCollection services, ICollection<Type> availableTypes)
		{
			// services.AddProvider<ProviderTvdb>();
		}
	}
}