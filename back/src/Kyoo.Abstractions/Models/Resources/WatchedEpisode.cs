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

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// Metadata of episode currently watching by an user
	/// </summary>
	public class WatchedEpisode
	{
		/// <summary>
		/// The ID of the user that started watching this episode.
		/// </summary>
		public int UserID { get; set; }

		/// <summary>
		/// The ID of the episode started.
		/// </summary>
		public int EpisodeID { get; set; }

		/// <summary>
		/// The <see cref="Episode"/> started.
		/// </summary>
		public Episode? Episode { get; set; }

		/// <summary>
		/// Where the player has stopped watching the episode (between 0 and 100).
		/// </summary>
		public int WatchedPercentage { get; set; }
	}
}
