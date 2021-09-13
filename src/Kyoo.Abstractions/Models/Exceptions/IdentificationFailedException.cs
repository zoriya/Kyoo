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
		{ }

		/// <summary>
		/// Create a new <see cref="IdentificationFailedException"/> with a custom message.
		/// </summary>
		/// <param name="message">The message to use.</param>
		public IdentificationFailedException(string message)
			: base(message)
		{ }

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
