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
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Abstractions.Models.Permissions;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static Kyoo.Abstractions.Models.Utils.Constants;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// An endpoint to retrieve subtitles for a specific episode.
	/// </summary>
	[Route("subtitles")]
	[Route("subtitle", Order = AlternativeRoute)]
	[PartialPermission("subtitle")]
	[ApiController]
	[ApiDefinition("Subtitles", Group = WatchGroup)]
	public class SubtitleApi : ControllerBase
	{
		/// <summary>
		/// The library manager used to modify or retrieve information about the data store.
		/// </summary>
		private readonly ILibraryManager _libraryManager;

		/// <summary>
		/// The file manager used to send subtitles files.
		/// </summary>
		private readonly IFileSystem _files;

		/// <summary>
		/// Create a new <see cref="SubtitleApi"/>.
		/// </summary>
		/// <param name="libraryManager">The library manager used to interact with the data store.</param>
		/// <param name="files">The file manager used to send subtitle files.</param>
		public SubtitleApi(ILibraryManager libraryManager, IFileSystem files)
		{
			_libraryManager = libraryManager;
			_files = files;
		}

		/// <summary>
		/// Get subtitle
		/// </summary>
		/// <remarks>
		/// Get the subtitle file with the given identifier.
		/// The extension is optional and can be used to ask Kyoo to convert the subtitle file on the fly.
		/// </remarks>
		/// <param name="identifier">
		/// The ID or slug of the subtitle (the same as the corresponding <see cref="Track"/>).
		/// </param>
		/// <param name="extension">An optional extension for the subtitle file.</param>
		/// <returns>The subtitle file</returns>
		/// <response code="404">No subtitle exist with the given ID or slug.</response>
		[HttpGet("{identifier:int}", Order = AlternativeRoute)]
		[HttpGet("{identifier:id}.{extension}")]
		[PartialPermission(Kind.Read)]
		[ProducesResponseType(StatusCodes.Status200OK)]
		[ProducesResponseType(StatusCodes.Status404NotFound)]
		[SuppressMessage("ReSharper", "RouteTemplates.ParameterTypeAndConstraintsMismatch",
			Justification = "An indentifier can be constructed with an int.")]
		public async Task<IActionResult> GetSubtitle(Identifier identifier, string extension)
		{
			Track subtitle = await identifier.Match(
				id => _libraryManager.GetOrDefault<Track>(id),
				slug =>
				{
					if (slug.Count(x => x == '.') == 3)
					{
						int idx = slug.LastIndexOf('.');
						extension = slug[(idx + 1)..];
						slug = slug[..idx];
					}
					return _libraryManager.GetOrDefault<Track>(Track.BuildSlug(slug, StreamType.Subtitle));
				});

			if (subtitle == null)
				return NotFound();
			if (subtitle.Codec == "subrip" && extension == "vtt")
				return new ConvertSubripToVtt(subtitle.Path, _files);
			return _files.FileResult(subtitle.Path);
		}

		/// <summary>
		/// An action result that convert a subrip subtitle to vtt.
		/// </summary>
		private class ConvertSubripToVtt : IActionResult
		{
			/// <summary>
			/// The path of the file to convert. It can be any path supported by a <see cref="IFileSystem"/>.
			/// </summary>
			private readonly string _path;

			/// <summary>
			/// The file system used to manipulate the given file.
			/// </summary>
			private readonly IFileSystem _files;

			/// <summary>
			/// Create a new <see cref="ConvertSubripToVtt"/>.
			/// </summary>
			/// <param name="subtitlePath">
			/// The path of the subtitle file. It can be any path supported by the given <paramref name="files"/>.
			/// </param>
			/// <param name="files">
			/// The file system used to interact with the file at the given <paramref name="subtitlePath"/>.
			/// </param>
			public ConvertSubripToVtt(string subtitlePath, IFileSystem files)
			{
				_path = subtitlePath;
				_files = files;
			}

			/// <inheritdoc />
			public async Task ExecuteResultAsync(ActionContext context)
			{
				List<string> lines = new();

				context.HttpContext.Response.StatusCode = 200;
				context.HttpContext.Response.Headers.Add("Content-Type", "text/vtt");

				await using (StreamWriter writer = new(context.HttpContext.Response.Body))
				{
					await writer.WriteLineAsync("WEBVTT");
					await writer.WriteLineAsync(string.Empty);
					await writer.WriteLineAsync(string.Empty);

					using StreamReader reader = new(await _files.GetReader(_path));
					string line;
					while ((line = await reader.ReadLineAsync()) != null)
					{
						if (line == string.Empty)
						{
							lines.Add(string.Empty);
							IEnumerable<string> processedBlock = _ConvertBlock(lines);
							foreach (string t in processedBlock)
								await writer.WriteLineAsync(t);
							lines.Clear();
						}
						else
							lines.Add(line);
					}
				}

				await context.HttpContext.Response.Body.FlushAsync();
			}

			/// <summary>
			/// Convert a block from subrip to vtt.
			/// </summary>
			/// <param name="lines">All the lines in the block.</param>
			/// <returns>The given block, converted to vtt.</returns>
			private static IList<string> _ConvertBlock(IList<string> lines)
			{
				if (lines.Count < 3)
					return lines;
				lines[1] = lines[1].Replace(',', '.');
				if (lines[2].Length > 5)
				{
					lines[1] += lines[2].Substring(0, 6) switch
					{
						"{\\an1}" => " line:93% position:15%",
						"{\\an2}" => " line:93%",
						"{\\an3}" => " line:93% position:85%",
						"{\\an4}" => " line:50% position:15%",
						"{\\an5}" => " line:50%",
						"{\\an6}" => " line:50% position:85%",
						"{\\an7}" => " line:7% position:15%",
						"{\\an8}" => " line:7%",
						"{\\an9}" => " line:7% position:85%",
						_ => " line:93%"
					};
				}

				if (lines[2].StartsWith("{\\an"))
					lines[2] = lines[2][6..];
				return lines;
			}
		}
	}
}
