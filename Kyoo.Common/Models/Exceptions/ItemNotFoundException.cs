using System;

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
	}
}