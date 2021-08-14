using System;
using System.Runtime.Serialization;

namespace Kyoo.Models.Exceptions
{
	/// <summary>
	/// An exception raised when an item could not be found.
	/// </summary>
	[Serializable]
	public class ItemNotFoundException : Exception
	{
		/// <summary>
		/// Create a default <see cref="ItemNotFoundException"/> with no message.
		/// </summary>
		public ItemNotFoundException() {}

		/// <summary>
		/// Create a new <see cref="ItemNotFoundException"/> with a message
		/// </summary>
		/// <param name="message">The message of the exception</param>
		public ItemNotFoundException(string message)
			: base(message)
		{ }
		
		/// <summary>
		/// The serialization constructor 
		/// </summary>
		/// <param name="info">Serialization infos</param>
		/// <param name="context">The serialization context</param>
		protected ItemNotFoundException(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{ }
	}
}