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

namespace Kyoo.Abstractions.Models;

/// <summary>
/// An issue that occured on kyoo.
/// </summary>
public class Issue : IAddedDate
{
	/// <summary>
	/// The type of issue (for example, "Scanner" if this issue was created due to scanning error).
	/// </summary>
	public string Domain { get; set; }

	/// <summary>
	/// Why this issue was caused? An unique cause that can be used to identify this issue.
	/// For the scanner, a cause should be a video path.
	/// </summary>
	public string Cause { get; set; }

	/// <summary>
	/// A human readable string explaining why this issue occured.
	/// </summary>
	public string Reason { get; set; }

	/// <summary>
	/// Some extra data that could store domain-specific info.
	/// </summary>
	public Dictionary<string, object> Extra { get; set; }

	/// <inheritdoc/>
	public DateTime AddedDate { get; set; }
}
