using System;
using Kyoo.Controllers;
using Unity;

namespace Kyoo
{
	/// <summary>
	/// A static class with helper functions to setup external modules
	/// </summary>
	public static class Module
	{
		/// <summary>
		/// Register a new task to the container.
		/// </summary>
		/// <param name="container">The container</param>
		/// <typeparam name="T">The type of the task</typeparam>
		/// <returns>The initial container.</returns>
		public static IUnityContainer RegisterTask<T>(this IUnityContainer container)
			where T : class, ITask
		{
			container.RegisterType<ITask, T>();
			return container;
		}

		/// <summary>
		/// Register a new repository to the container.
		/// </summary>
		/// <param name="container">The container</param>
		/// <typeparam name="T">The type of the repository.</typeparam>
		/// <remarks>
		/// If your repository implements a special interface, please use <see cref="RegisterRepository{T,T}"/>
		/// </remarks>
		/// <returns>The initial container.</returns>
		public static IUnityContainer RegisterRepository<T>(this IUnityContainer container)
			where T : IBaseRepository
		{
			Type repository = Utility.GetGenericDefinition(typeof(T), typeof(IRepository<>));

			if (repository != null)
			{
				container.RegisterType(repository, typeof(T));
				container.RegisterType<IBaseRepository, T>(repository.FriendlyName());
			}
			else
				container.RegisterType<IBaseRepository, T>(typeof(T).FriendlyName());
			return container;
		}

		/// <summary>
		/// Register a new repository with a custom mapping to the container.
		/// </summary>
		/// <param name="container"></param>
		/// <typeparam name="T">The custom mapping you have for your repository.</typeparam>
		/// <typeparam name="T2">The type of the repository.</typeparam>
		/// <remarks>
		/// If your repository does not implements a special interface, please use <see cref="RegisterRepository{T}"/>
		/// </remarks>
		/// <returns>The initial container.</returns>
		public static IUnityContainer RegisterRepository<T, T2>(this IUnityContainer container)
			where T2 : IBaseRepository, T
		{
			container.RegisterType<T, T2>();
			return container.RegisterRepository<T2>();
		}
	}
}