using System;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Controllers
{
	/// <summary>
	/// A list of constant priorities used for <see cref="IStartupAction"/>'s <see cref="IStartupAction.Priority"/>.
	/// It also contains helper methods for creating new <see cref="StartupAction"/>.
	/// </summary>
	public static class SA
	{
		public const int Before = 5000;
		public const int Routing = 4000;
		public const int StaticFiles = 3000;
		public const int Authentication = 2000;
		public const int Authorization = 1000;
		public const int Endpoint = 0;
		public const int After = -1000;

		/// <summary>
		/// Create a new <see cref="StartupAction"/>.
		/// </summary>
		/// <param name="action">The action to run</param>
		/// <param name="priority">The priority of the new action</param>
		/// <returns>A new <see cref="StartupAction"/></returns>
		public static StartupAction New(Action action, int priority) 
			=> new(action, priority);
		
		/// <summary>
		/// Create a new <see cref="StartupAction"/>.
		/// </summary>
		/// <param name="action">The action to run</param>
		/// <param name="priority">The priority of the new action</param>
		/// <typeparam name="T">A dependency that this action will use.</typeparam>
		/// <returns>A new <see cref="StartupAction"/></returns>
		public static StartupAction<T> New<T>(Action<T> action, int priority) 
			=> new(action, priority);
		
		/// <summary>
		/// Create a new <see cref="StartupAction"/>.
		/// </summary>
		/// <param name="action">The action to run</param>
		/// <param name="priority">The priority of the new action</param>
		/// <typeparam name="T">A dependency that this action will use.</typeparam>
		/// <typeparam name="T2">A second dependency that this action will use.</typeparam>
		/// <returns>A new <see cref="StartupAction"/></returns>
		public static StartupAction<T, T2> New<T, T2>(Action<T, T2> action, int priority) 
			=> new(action, priority);
		
		/// <summary>
		/// Create a new <see cref="StartupAction"/>.
		/// </summary>
		/// <param name="action">The action to run</param>
		/// <param name="priority">The priority of the new action</param>
		/// <typeparam name="T">A dependency that this action will use.</typeparam>
		/// <typeparam name="T2">A second dependency that this action will use.</typeparam>
		/// <typeparam name="T3">A third dependency that this action will use.</typeparam>
		/// <returns>A new <see cref="StartupAction"/></returns>
		public static StartupAction<T, T2, T3> New<T, T2, T3>(Action<T, T2, T3> action, int priority) 
			=> new(action, priority);
	}
	
	
	/// <summary>
	/// An action executed on kyoo's startup to initialize the asp-net container.
	/// </summary>
	/// <remarks>
	/// This is the base interface, see <see cref="StartupAction"/> for a simpler use of this.
	/// </remarks>
	public interface IStartupAction
	{
		/// <summary>
		/// The priority of this action. The actions will be executed on descending priority order.
		/// If two actions have the same priority, their order is undefined.
		/// </summary>
		int Priority { get; }

		/// <summary>
		/// Run this action to configure the container, a service provider containing all services can be used.
		/// </summary>
		/// <param name="provider">The service provider containing all services can be used.</param>
		void Run(IServiceProvider provider);
	}
		
	/// <summary>
	/// A <see cref="IStartupAction"/> with no dependencies.
	/// </summary>
	public class StartupAction : IStartupAction
	{
		/// <summary>
		/// The action to execute at startup.
		/// </summary>
		private readonly Action _action;

		/// <inheritdoc />
		public int Priority { get; }
		
		/// <summary>
		/// Create a new <see cref="StartupAction"/>.
		/// </summary>
		/// <param name="action">The action to execute on startup.</param>
		/// <param name="priority">The priority of this action (see <see cref="Priority"/>).</param>
		public StartupAction(Action action, int priority)
		{
			_action = action;
			Priority = priority;
		}

		/// <inheritdoc />
		public void Run(IServiceProvider provider)
		{
			_action.Invoke();
		}
	}

	/// <summary>
	/// A <see cref="IStartupAction"/> with one dependencies.
	/// </summary>
	/// <typeparam name="T">The dependency to use.</typeparam>
	public class StartupAction<T> : IStartupAction
	{
		/// <summary>
		/// The action to execute at startup.
		/// </summary>
		private readonly Action<T> _action;

		/// <inheritdoc />
		public int Priority { get; }
		
		/// <summary>
		/// Create a new <see cref="StartupAction{T}"/>.
		/// </summary>
		/// <param name="action">The action to execute on startup.</param>
		/// <param name="priority">The priority of this action (see <see cref="Priority"/>).</param>
		public StartupAction(Action<T> action, int priority)
		{
			_action = action;
			Priority = priority;
		}

		/// <inheritdoc />
		public void Run(IServiceProvider provider)
		{
			_action.Invoke(provider.GetRequiredService<T>());
		}
	}
	
	/// <summary>
	/// A <see cref="IStartupAction"/> with two dependencies.
	/// </summary>
	/// <typeparam name="T">The dependency to use.</typeparam>
	/// <typeparam name="T2">The second dependency to use.</typeparam>
	public class StartupAction<T, T2> : IStartupAction
	{
		/// <summary>
		/// The action to execute at startup.
		/// </summary>
		private readonly Action<T, T2> _action;

		/// <inheritdoc />
		public int Priority { get; }

		/// <summary>
		/// Create a new <see cref="StartupAction{T, T2}"/>.
		/// </summary>
		/// <param name="action">The action to execute on startup.</param>
		/// <param name="priority">The priority of this action (see <see cref="Priority"/>).</param>
		public StartupAction(Action<T, T2> action, int priority)
		{
			_action = action;
			Priority = priority;
		}

		/// <inheritdoc />
		public void Run(IServiceProvider provider)
		{
			_action.Invoke(
				provider.GetRequiredService<T>(),
				provider.GetRequiredService<T2>()
			);
		}
	}
	
	/// <summary>
	/// A <see cref="IStartupAction"/> with three dependencies.
	/// </summary>
	/// <typeparam name="T">The dependency to use.</typeparam>
	/// <typeparam name="T2">The second dependency to use.</typeparam>
	/// <typeparam name="T3">The third dependency to use.</typeparam>
	public class StartupAction<T, T2, T3> : IStartupAction
	{
		/// <summary>
		/// The action to execute at startup.
		/// </summary>
		private readonly Action<T, T2, T3> _action;

		/// <inheritdoc />
		public int Priority { get; }
		
		/// <summary>
		/// Create a new <see cref="StartupAction{T, T2, T3}"/>.
		/// </summary>
		/// <param name="action">The action to execute on startup.</param>
		/// <param name="priority">The priority of this action (see <see cref="Priority"/>).</param>
		public StartupAction(Action<T, T2, T3> action, int priority)
		{
			_action = action;
			Priority = priority;
		}

		/// <inheritdoc />
		public void Run(IServiceProvider provider)
		{
			_action.Invoke(
				provider.GetRequiredService<T>(),
				provider.GetRequiredService<T2>(),
				provider.GetRequiredService<T3>()
			);
		}
	}
}