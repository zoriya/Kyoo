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