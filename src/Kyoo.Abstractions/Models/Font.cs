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

using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Utils;
using PathIO = System.IO.Path;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A font of an <see cref="Episode"/>.
	/// </summary>
	public class Font
	{
		/// <summary>
		/// A human-readable identifier, used in the URL.
		/// </summary>
		public string Slug { get; set; }

		/// <summary>
		/// The name of the font file (with the extension).
		/// </summary>
		public string File { get; set; }

		/// <summary>
		/// The format of this font (the extension).
		/// </summary>
		public string Format { get; set; }

		/// <summary>
		/// The path of the font.
		/// </summary>
		[SerializeIgnore] public string Path { get; set; }

		/// <summary>
		/// Create a new empty <see cref="Font"/>.
		/// </summary>
		public Font() { }

		/// <summary>
		/// Create a new <see cref="Font"/> from a path.
		/// </summary>
		/// <param name="path">The path of the font.</param>
		public Font(string path)
		{
			Slug = Utility.ToSlug(PathIO.GetFileNameWithoutExtension(path));
			Path = path;
			File = PathIO.GetFileName(path);
			Format = PathIO.GetExtension(path).Replace(".", string.Empty);
		}
	}
}
