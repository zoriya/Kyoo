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

using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Abstractions.Models;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Abstractions.Controllers
{
	/// <summary>
	/// A service to abstract the file system to allow custom file systems
	/// (like distant file systems or external providers).
	/// </summary>
	public interface IFileSystem
	{
		/// <summary>
		/// Used for http queries returning a file. This should be used to return local files
		/// or proxy them from a distant server.
		/// </summary>
		/// <remarks>
		/// If no file exists at the given path or if the path is null, a NotFoundResult is returned
		/// to handle it gracefully.
		/// </remarks>
		/// <param name="path">The path of the file.</param>
		/// <param name="rangeSupport">
		/// Should the file be downloaded at once or is the client allowed to request only part of the file
		/// </param>
		/// <param name="type">
		/// You can manually specify the content type of your file.
		/// For example you can force a file to be returned as plain text using <c>text/plain</c>.
		/// If the type is not specified, it will be deduced automatically (from the extension or by sniffing the file).
		/// </param>
		/// <returns>An <see cref="IActionResult"/> representing the file returned.</returns>
		IActionResult FileResult([CanBeNull] string path, bool rangeSupport = false, string type = null);

		/// <summary>
		/// Read a file present at <paramref name="path"/>. The reader can be used in an arbitrary context.
		/// To return files from an http endpoint, use <see cref="FileResult"/>.
		/// </summary>
		/// <param name="path">The path of the file</param>
		/// <exception cref="FileNotFoundException">If the file could not be found.</exception>
		/// <returns>A reader to read the file.</returns>
		Task<Stream> GetReader([NotNull] string path);

		/// <summary>
		/// Read a file present at <paramref name="path"/>. The reader can be used in an arbitrary context.
		/// To return files from an http endpoint, use <see cref="FileResult"/>.
		/// </summary>
		/// <param name="path">The path of the file</param>
		/// <param name="mime">The mime type of the opened file.</param>
		/// <exception cref="FileNotFoundException">If the file could not be found.</exception>
		/// <returns>A reader to read the file.</returns>
		Task<Stream> GetReader([NotNull] string path, AsyncRef<string> mime);

		/// <summary>
		/// Create a new file at <paramref name="path"></paramref>.
		/// </summary>
		/// <param name="path">The path of the new file.</param>
		/// <returns>A writer to write to the new file.</returns>
		Task<Stream> NewFile([NotNull] string path);

		/// <summary>
		/// Create a new directory at the given path
		/// </summary>
		/// <param name="path">The path of the directory</param>
		/// <returns>The path of the newly created directory is returned.</returns>
		Task<string> CreateDirectory([NotNull] string path);

		/// <summary>
		/// Combine multiple paths.
		/// </summary>
		/// <param name="paths">The paths to combine</param>
		/// <returns>The combined path.</returns>
		string Combine(params string[] paths);

		/// <summary>
		/// List files in a directory.
		/// </summary>
		/// <param name="path">The path of the directory</param>
		/// <param name="options">Should the search be recursive or not.</param>
		/// <returns>A list of files's path.</returns>
		Task<ICollection<string>> ListFiles([NotNull] string path,
			SearchOption options = SearchOption.TopDirectoryOnly);

		/// <summary>
		/// Check if a file exists at the given path.
		/// </summary>
		/// <param name="path">The path to check</param>
		/// <returns>True if the path exists, false otherwise</returns>
		Task<bool> Exists([NotNull] string path);

		/// <summary>
		/// Get the extra directory of a resource <typeparamref name="T"/>.
		/// This method is in this system to allow a filesystem to use a different metadata policy for one.
		/// It can be useful if the filesystem is readonly.
		/// </summary>
		/// <param name="resource">The resource to proceed</param>
		/// <typeparam name="T">The type of the resource.</typeparam>
		/// <returns>The extra directory of the resource.</returns>
		Task<string> GetExtraDirectory<T>([NotNull] T resource);

		/// <summary>
		/// Retrieve tracks for a specific episode.
		/// Subtitles, chapters and fonts should also be extracted and cached when calling this method.
		/// </summary>
		/// <param name="episode">The episode to retrieve tracks for.</param>
		/// <param name="reExtract">Should the cache be invalidated and subtitles and others be re-extracted?</param>
		/// <returns>The list of tracks available for this episode.</returns>
		Task<ICollection<Track>> ExtractInfos([NotNull] Episode episode, bool reExtract);

		/// <summary>
		/// Transmux the selected episode to hls.
		/// </summary>
		/// <param name="episode">The episode to transmux.</param>
		/// <returns>The master file (m3u8) of the transmuxed hls file.</returns>
		IActionResult Transmux([NotNull] Episode episode);

		// Maybe add options for to select the codec.
		// IActionResult Transcode(Episode episode);
	}
}
