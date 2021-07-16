using System;
using System.Runtime.Serialization;
using Kyoo.Controllers;

namespace Kyoo.Models.Exceptions
{
	/// <summary>
	/// An exception raised when an <see cref="IIdentifier"/> failed.
	/// </summary>
	[Serializable]
	public class IdentificationFailed : Exception
	{
		/// <summary>
		/// Create a new <see cref="IdentificationFailed"/> with a default message.
		/// </summary>
		public IdentificationFailed()
			: base("An identification failed.")
		{}
		
		/// <summary>
		/// Create a new <see cref="IdentificationFailed"/> with a custom message.
		/// </summary>
		/// <param name="message">The message to use.</param>
		public IdentificationFailed(string message)
			: base(message)
		{}
		
		/// <summary>
		/// The serialization constructor 
		/// </summary>
		/// <param name="info">Serialization infos</param>
		/// <param name="context">The serialization context</param>
		protected IdentificationFailed(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{ }
	}
}