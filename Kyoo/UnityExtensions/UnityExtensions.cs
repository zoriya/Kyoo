using System.Reflection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Unity;
using Unity.Microsoft.DependencyInjection;

namespace Kyoo.UnityExtensions
{
	public static class UnityExtensions
	{
		public static IWebHostBuilder UseUnityProvider(this IWebHostBuilder host, UnityContainer container)
		{
			UnityProvider factory = new(container);
			
			return host.ConfigureServices((_, services) =>
			{
				services.Replace(ServiceDescriptor.Singleton<IServiceProviderFactory<UnityContainer>>(factory));
				services.Replace(ServiceDescriptor.Singleton<IServiceProviderFactory<IUnityContainer>>(factory));
				services.Replace(ServiceDescriptor.Singleton<IServiceProviderFactory<IServiceCollection>>(factory));
			});
		}

		public static IUnityContainer AddServices(this IUnityContainer container, IServiceCollection services)
		{
			return (IUnityContainer)typeof(ServiceProviderExtensions).Assembly
				.GetType("Unity.Microsoft.DependencyInjection.Configuration")
				!.GetMethod("AddServices", BindingFlags.Static | BindingFlags.NonPublic)
				!.Invoke(null, new object[] {container, services});
		}
	}
}