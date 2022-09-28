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

using System.Threading.Tasks;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;

namespace Kyoo.Abstractions.Controllers
{
	/// <summary>
	/// An interface to identify episodes, shows and metadata based on the episode file.
	/// </summary>
	public interface IIdentifier
	{
		/// <summary>
		/// Identify a path and return the parsed metadata.
		/// </summary>
		/// <param name="path">The path of the episode file to parse.</param>
		/// <exception cref="IdentificationFailedException">
		/// The identifier could not work for the given path.
		/// </exception>
		/// <returns>
		/// A tuple of models representing parsed metadata.
		/// If no metadata could be parsed for a type, null can be returned.
		/// </returns>
		Task<(Collection, Show, Season, Episode)> Identify(string path);

		/// <summary>
		/// Identify an external subtitle or track file from it's path and return the parsed metadata.
		/// </summary>
		/// <param name="path">The path of the external track file to parse.</param>
		/// <exception cref="IdentificationFailedException">
		/// The identifier could not work for the given path.
		/// </exception>
		/// <returns>
		/// The metadata of the track identified.
		/// </returns>
		Task<Track> IdentifyTrack(string path);
	}
}
