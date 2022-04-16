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
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Abstractions.Models;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Abstractions.Controllers
{
	/// <summary>
	/// Transcoder responsible of handling low level video details.
	/// </summary>
	public interface ITranscoder
	{
		/// <summary>
		/// Retrieve tracks for a specific episode.
		/// Subtitles, chapters and fonts should also be extracted and cached when calling this method.
		/// </summary>
		/// <param name="episode">The episode to retrieve tracks for.</param>
		/// <param name="reExtract">Should the cache be invalidated and subtitles and others be re-extracted?</param>
		/// <returns>The list of tracks available for this episode.</returns>
		Task<ICollection<Track>> ExtractInfos(Episode episode, bool reExtract);

		/// <summary>
		/// List fonts assosiated with this episode.
		/// </summary>
		/// <param name="episode">Th episode to list fonts for.</param>
		/// <returns>The list of attachements for this epiosode.</returns>
		Task<ICollection<Font>> ListFonts(Episode episode);

		/// <summary>
		/// Get the specified font for this episode.
		/// </summary>
		/// <param name="episode">The episode to list fonts for.</param>
		/// <param name="slug">The slug of the specific font to retrive.</param>
		/// <returns>The <see cref="Font"/> with the given slug or null.</returns>
		[ItemCanBeNull] Task<Font> GetFont(Episode episode, string slug);

		/// <summary>
		/// Transmux the selected episode to hls.
		/// </summary>
		/// <param name="episode">The episode to transmux.</param>
		/// <returns>The master file (m3u8) of the transmuxed hls file.</returns>
		IActionResult Transmux(Episode episode);
	}
}
