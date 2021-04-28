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
	}
}