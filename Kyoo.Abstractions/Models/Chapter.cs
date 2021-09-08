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
	/// A chapter to split an episode in multiple parts.
	/// </summary>
	public class Chapter
	{
		/// <summary>
		/// The start time of the chapter (in second from the start of the episode).
		/// </summary>
		public float StartTime { get; set; }

		/// <summary>
		/// The end time of the chapter (in second from the start of the episode).
		/// </summary>
		public float EndTime { get; set; }

		/// <summary>
		/// The name of this chapter. This should be a human-readable name that could be presented to the user.
		/// There should be well-known chapters name for commonly used chapters.
		/// For example, use "Opening" for the introduction-song and "Credits" for the end chapter with credits.
		/// </summary>
		public string Name { get; set; }

		/// <summary>
		/// Create a new <see cref="Chapter"/>.
		/// </summary>
		/// <param name="startTime">The start time of the chapter (in second)</param>
		/// <param name="endTime">The end time of the chapter (in second)</param>
		/// <param name="name">The name of this chapter</param>
		public Chapter(float startTime, float endTime, string name)
		{
			StartTime = startTime;
			EndTime = endTime;
			Name = name;
		}
	}
}
