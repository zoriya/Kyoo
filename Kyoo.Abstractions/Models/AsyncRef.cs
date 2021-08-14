namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A class wrapping a value that will be set after the completion of the task it is related to.
	/// </summary>
	/// <remarks>
	/// This class replace the use of an out parameter on a task since tasks and out can't be combined.
	/// </remarks>
	/// <typeparam name="T">The type of the value</typeparam>
	public class AsyncRef<T>
	{
		/// <summary>
		/// The value that will be set before the completion of the task.
		/// </summary>
		public T Value { get; set; }
	}
}