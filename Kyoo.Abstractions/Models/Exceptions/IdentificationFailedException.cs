using System;
using System.Runtime.Serialization;
using Kyoo.Abstractions.Controllers;

namespace Kyoo.Abstractions.Models.Exceptions
{
	/// <summary>
	/// An exception raised when an <see cref="IIdentifier"/> failed.
	/// </summary>
	[Serializable]
	public class IdentificationFailedException : Exception
	{
		/// <summary>
		/// Create a new <see cref="IdentificationFailedException"/> with a default message.
		/// </summary>
		public IdentificationFailedException()
			: base("An identification failed.")
		{}
		
		/// <summary>
		/// Create a new <see cref="IdentificationFailedException"/> with a custom message.
		/// </summary>
		/// <param name="message">The message to use.</param>
		public IdentificationFailedException(string message)
			: base(message)
		{}
		
		/// <summary>
		/// The serialization constructor 
		/// </summary>
		/// <param name="info">Serialization infos</param>
		/// <param name="context">The serialization context</param>
		protected IdentificationFailedException(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{ }
	}
}