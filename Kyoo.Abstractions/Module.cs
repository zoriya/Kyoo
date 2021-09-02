using Autofac;
using Autofac.Builder;
using Kyoo.Abstractions.Controllers;
using Kyoo.Utils;
using Microsoft.Extensions.Configuration;

namespace Kyoo.Abstractions
{
	/// <summary>
	/// A static class with helper functions to setup external modules
	/// </summary>
	public static class Module
	{
		/// <summary>
		/// Register a new task to the container.
		/// </summary>
		/// <param name="builder">The container</param>
		/// <typeparam name="T">The type of the task</typeparam>
		/// <returns>The registration builder of this new task. That can be used to edit the registration.</returns>
		public static IRegistrationBuilder<T, ConcreteReflectionActivatorData, SingleRegistrationStyle>
			RegisterTask<T>(this ContainerBuilder builder)
			where T : class, ITask
		{
			return builder.RegisterType<T>().As<ITask>();
		}

		/// <summary>
		/// Register a new metadata provider to the container.
		/// </summary>
		/// <param name="builder">The container</param>
		/// <typeparam name="T">The type of the task</typeparam>
		/// <returns>The registration builder of this new provider. That can be used to edit the registration.</returns>
		public static IRegistrationBuilder<T, ConcreteReflectionActivatorData, SingleRegistrationStyle> 
			RegisterProvider<T>(this ContainerBuilder builder)
			where T : class, IMetadataProvider
		{
			return builder.RegisterType<T>().As<IMetadataProvider>().InstancePerLifetimeScope();
		}

		/// <summary>
		/// Register a new repository to the container.
		/// </summary>
		/// <param name="builder">The container</param>
		/// <typeparam name="T">The type of the repository.</typeparam>
		/// <remarks>
		/// If your repository implements a special interface, please use <see cref="RegisterRepository{T,T2}"/>
		/// </remarks>
		/// <returns>The initial container.</returns>
		public static IRegistrationBuilder<T, ConcreteReflectionActivatorData, SingleRegistrationStyle> 
			RegisterRepository<T>(this ContainerBuilder builder)
			where T : IBaseRepository
		{
			return builder.RegisterType<T>()
				.As<IBaseRepository>()
				.As(Utility.GetGenericDefinition(typeof(T), typeof(IRepository<>)))
				.InstancePerLifetimeScope();
		}

		/// <summary>
		/// Register a new repository with a custom mapping to the container.
		/// </summary>
		/// <param name="builder">The container</param>
		/// <typeparam name="T">The custom mapping you have for your repository.</typeparam>
		/// <typeparam name="T2">The type of the repository.</typeparam>
		/// <remarks>
		/// If your repository does not implements a special interface, please use <see cref="RegisterRepository{T}"/>
		/// </remarks>
		/// <returns>The initial container.</returns>
		public static IRegistrationBuilder<T2, ConcreteReflectionActivatorData, SingleRegistrationStyle>
			RegisterRepository<T, T2>(this ContainerBuilder builder)
			where T2 : IBaseRepository, T
		{
			return builder.RegisterRepository<T2>().As<T>();
		}

		/// <summary>
		/// Get the public URL of kyoo using the given configuration instance.
		/// </summary>
		/// <param name="configuration">The configuration instance</param>
		/// <returns>The public URl of kyoo (without a slash at the end)</returns>
		public static string GetPublicUrl(this IConfiguration configuration)
		{
			return configuration["basics:publicUrl"]?.TrimEnd('/') ?? "http://localhost:5000";
		}
	}
}