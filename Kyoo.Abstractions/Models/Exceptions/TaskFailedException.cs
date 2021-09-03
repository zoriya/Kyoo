using System;
using System.Runtime.Serialization;
using Kyoo.Abstractions.Controllers;

namespace Kyoo.Abstractions.Models.Exceptions
{
	/// <summary>
	/// An exception raised when an <see cref="ITask"/> failed.
	/// </summary>
	[Serializable]
	public class TaskFailedException : AggregateException
	{
		/// <summary>
		/// Create a new <see cref="TaskFailedException"/> with a default message.
		/// </summary>
		public TaskFailedException()
			: base("A task failed.")
		{ }

		/// <summary>
		/// Create a new <see cref="TaskFailedException"/> with a custom message.
		/// </summary>
		/// <param name="message">The message to use.</param>
		public TaskFailedException(string message)
			: base(message)
		{ }

		/// <summary>
		/// Create a new <see cref="TaskFailedException"/> wrapping another exception.
		/// </summary>
		/// <param name="exception">The exception to wrap.</param>
		public TaskFailedException(Exception exception)
			: base(exception)
		{ }

		/// <summary>
		/// The serialization constructor 
		/// </summary>
		/// <param name="info">Serialization infos</param>
		/// <param name="context">The serialization context</param>
		protected TaskFailedException(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{ }
	}
}