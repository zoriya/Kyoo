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

namespace Kyoo.Abstractions.Controllers;

/// <summary>
/// Information about the pagination. How many items should be displayed and where to start.
/// </summary>
public class SearchPagination
{
	/// <summary>
	/// The count of items to return.
	/// </summary>
	public int Limit { get; set; } = 50;

	/// <summary>
	/// Where to start? How many items to skip?
	/// </summary>
	public int? Skip { get; set; }
}
