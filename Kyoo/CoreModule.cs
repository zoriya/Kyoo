using Kyoo.Controllers;
using Unity;

namespace Kyoo
{
	/// <summary>
	/// The core module ccontaining default implementations
	/// </summary>
	public class CoreModule : IPlugin
	{
		/// <inheritdoc />
		public string Slug => "core";
		
		/// <inheritdoc />
		public string Name => "Core";
		
		/// <inheritdoc />
		public string Description => "The core module containing default implementations.";

		/// <inheritdoc cref="IPlugin.Configure" />
		public static void Configure(IUnityContainer container)
		{
			container.AddTask<Crawler>();
		}
	}
}