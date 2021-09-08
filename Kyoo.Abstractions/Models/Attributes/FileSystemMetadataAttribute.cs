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
using System.Collections.Generic;
using System.ComponentModel.Composition;
using Kyoo.Abstractions.Controllers;

namespace Kyoo.Abstractions.Models.Attributes
{
	/// <summary>
	/// An attribute to inform how a <see cref="IFileSystem"/> works.
	/// </summary>
	[MetadataAttribute]
	[AttributeUsage(AttributeTargets.Class)]
	public class FileSystemMetadataAttribute : Attribute
	{
		/// <summary>
		/// The scheme(s) used to identify this path.
		/// It can be something like http, https, ftp, file and so on.
		/// </summary>
		/// <remarks>
		/// If multiples files with the same schemes exists, an exception will be thrown.
		/// </remarks>
		public string[] Scheme { get; }

		/// <summary>
		/// <c>true</c> if the scheme should be removed from the path before calling
		/// methods of this <see cref="IFileSystem"/>, <c>false</c> otherwise.
		/// </summary>
		public bool StripScheme { get; set; }

		/// <summary>
		/// Create a new <see cref="FileSystemMetadataAttribute"/> using the specified schemes.
		/// </summary>
		/// <param name="schemes">The schemes to use.</param>
		public FileSystemMetadataAttribute(string[] schemes)
		{
			Scheme = schemes;
		}

		/// <summary>
		/// Create a new <see cref="FileSystemMetadataAttribute"/> using a dictionary of metadata.
		/// </summary>
		/// <param name="metadata">
		/// The dictionary of metadata. This method expect the dictionary to contain a field
		/// per property in this attribute, with the same types as the properties of this attribute.
		/// </param>
		public FileSystemMetadataAttribute(IDictionary<string, object> metadata)
		{
			Scheme = (string[])metadata[nameof(Scheme)];
			StripScheme = (bool)metadata[nameof(StripScheme)];
		}
	}
}
