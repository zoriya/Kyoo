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
using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Abstractions.Controllers
{
	/// <summary>
	/// A list of constant priorities used for <see cref="IStartupAction"/>'s <see cref="IStartupAction.Priority"/>.
	/// It also contains helper methods for creating new <see cref="StartupAction"/>.
	/// </summary>
	[SuppressMessage("StyleCop.CSharp.DocumentationRules", "SA1649:File name should match first type name",
		Justification = "StartupAction is nested and the name SA is short to improve readability in plugin's startup.")]
	public static class SA
	{
		/// <summary>
		/// The highest predefined priority existing for <see cref="StartupAction"/>.
		/// </summary>
		public const int Before = 5000;

		/// <summary>
		/// Items defining routing (see IApplicationBuilder.UseRouting use this priority.
		/// </summary>
		public const int Routing = 4000;

		/// <summary>
		/// Actions defining new static files router use this priority.
		/// </summary>
		public const int StaticFiles = 3000;

		/// <summary>
		/// Actions calling IApplicationBuilder.UseAuthentication use this priority.
		/// </summary>
		public const int Authentication = 2000;

		/// <summary>
		/// Actions calling IApplicationBuilder.UseAuthorization use this priority.
		/// </summary>
		public const int Authorization = 1000;

		/// <summary>
		/// Action adding endpoint should use this priority (with a negative modificator if there is a catchall).
		/// </summary>
		public const int Endpoint = 0;

		/// <summary>
		/// The lowest predefined priority existing for <see cref="StartupAction"/>.
		/// It should run after all other actions.
		/// </summary>
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

	/// <summary>
	/// An action executed on kyoo's startup to initialize the asp-net container.
	/// </summary>
	/// <remarks>
	/// This is the base interface, see <see cref="SA.StartupAction"/> for a simpler use of this.
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
}
