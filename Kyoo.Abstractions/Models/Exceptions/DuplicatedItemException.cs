using System;
using System.Runtime.Serialization;

namespace Kyoo.Abstractions.Models.Exceptions
{
	/// <summary>
	/// An exception raised when an item already exists in the database.
	/// </summary>
	[Serializable]
	public class DuplicatedItemException : Exception
	{
		/// <summary>
		/// Create a new <see cref="DuplicatedItemException"/> with the default message.
		/// </summary>
		public DuplicatedItemException()
			: base("Already exists in the database.")
		{ }

		/// <summary>
		/// Create a new <see cref="DuplicatedItemException"/> with a custom message.
		/// </summary>
		/// <param name="message">The message to use</param>
		public DuplicatedItemException(string message)
			: base(message)
		{ }

		/// <summary>
		/// The serialization constructor 
		/// </summary>
		/// <param name="info">Serialization infos</param>
		/// <param name="context">The serialization context</param>
		protected DuplicatedItemException(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{ }
	}
}
