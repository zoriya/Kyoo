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
		/// <param name="services">The container</param>
		/// <typeparam name="T">The type of the task</typeparam>
		/// <returns>The initial container.</returns>
		public static IUnityContainer AddTask<T>(this IUnityContainer services)
			where T : class, ITask
		{
			services.RegisterSingleton<ITask, T>();
			return services;
		}
	}
}