using System;
using Microsoft.Extensions.DependencyInjection;
using Unity;
using Unity.Microsoft.DependencyInjection;

namespace Kyoo.UnityExtensions
{
	public class UnityProvider : ServiceProviderFactory, IServiceProviderFactory<UnityContainer>
	{
		private readonly UnityContainer _container;
		
		
		public UnityProvider(UnityContainer container)
			: base(container)
		{
			_container = container;
		}
		
		public UnityContainer CreateBuilder(IServiceCollection services)
		{
			_container.AddServices(services);
			return _container;
		}
		
		public IServiceProvider CreateServiceProvider(UnityContainer containerBuilder)
		{
			return CreateServiceProvider(containerBuilder as IUnityContainer);
		}
	}
}