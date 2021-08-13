using System;
using System.Threading.Tasks;
using JetBrains.Annotations;

namespace Kyoo
{
	/// <summary>
	/// A class containing helper method for tasks.
	/// </summary>
	public static class TaskUtils
	{
		/// <summary>
		/// Run a method after the execution of the task.
		/// </summary>
		/// <param name="task">The task to wait.</param>
		/// <param name="then">
		/// The method to run after the task finish. This will only be run if the task finished successfully.
		/// </param>
		/// <typeparam name="T">The type of the item in the task.</typeparam>
		/// <returns>A continuation task wrapping the initial task and adding a continuation method.</returns>
		/// <exception cref="TaskCanceledException"></exception>
		/// <exception cref="TaskCanceledException">The source task has been canceled.</exception>
		public static Task<T> Then<T>(this Task<T> task, Action<T> then)
		{
			return task.ContinueWith(x =>
			{
				if (x.IsFaulted)
					x.Exception!.InnerException!.ReThrow();
				if (x.IsCanceled)
					throw new TaskCanceledException();
				then(x.Result);
				return x.Result;
			}, TaskContinuationOptions.ExecuteSynchronously);
		}

		/// <summary>
		/// Map the result of a task to another result.
		/// </summary>
		/// <param name="task">The task to map.</param>
		/// <param name="map">The mapper method, it take the task's result as a parameter and should return the new result.</param>
		/// <typeparam name="T">The type of returns of the given task</typeparam>
		/// <typeparam name="TResult">The resulting task after the mapping method</typeparam>
		/// <returns>A task wrapping the initial task and mapping the initial result.</returns>
		/// <exception cref="TaskCanceledException">The source task has been canceled.</exception>
		public static Task<TResult> Map<T, TResult>(this Task<T> task, Func<T, TResult> map)
		{
			return task.ContinueWith(x =>
			{
				if (x.IsFaulted)
					x.Exception!.InnerException!.ReThrow();
				if (x.IsCanceled)
					throw new TaskCanceledException();
				return map(x.Result);
			}, TaskContinuationOptions.ExecuteSynchronously);
		}

		/// <summary>
		/// A method to return the a default value from a task if the initial task is null.
		/// </summary>
		/// <param name="value">The initial task</param>
		/// <typeparam name="T">The type that the task will return</typeparam>
		/// <returns>A non-null task.</returns>
		[NotNull]
		public static Task<T> DefaultIfNull<T>([CanBeNull] Task<T> value)
		{
			return value ?? Task.FromResult<T>(default);
		}
	}
}