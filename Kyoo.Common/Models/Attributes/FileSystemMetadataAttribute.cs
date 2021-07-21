using System;
using System.ComponentModel.Composition;
using Kyoo.Controllers;

namespace Kyoo.Common.Models.Attributes
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
		

		public FileSystemMetadataAttribute(string[] schemes)
		{
			Scheme = schemes;
		}
	}
}