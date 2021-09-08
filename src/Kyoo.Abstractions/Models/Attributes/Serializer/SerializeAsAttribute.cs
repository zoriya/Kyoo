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

namespace Kyoo.Abstractions.Models.Attributes
{
	/// <summary>
	/// Change the way the field is serialized. It allow one to use a string format like formatting instead of the default value.
	/// This can be disabled for a request by setting the "internal" query string parameter to true.
	/// </summary>
	[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
	public class SerializeAsAttribute : Attribute
	{
		/// <summary>
		/// The format string to use.
		/// </summary>
		public string Format { get; }

		/// <summary>
		/// Create a new <see cref="SerializeAsAttribute"/> with the selected format.
		/// </summary>
		/// <remarks>
		/// The format string can contains any property within {}. It will be replaced by the actual value of the property.
		/// You can also use the special value {HOST} that will put the webhost address.
		/// </remarks>
		/// <example>
		/// The show's poster serialized uses this format string: <code>{HOST}/api/shows/{Slug}/poster</code>
		/// </example>
		/// <param name="format">The format to use</param>
		public SerializeAsAttribute(string format)
		{
			Format = format;
		}
	}
}
