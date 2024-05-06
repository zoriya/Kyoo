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

namespace Kyoo.Abstractions.Models;

public interface IRefreshable
{
	/// <summary>
	/// The date of the next metadata refresh. Null if auto-refresh is disabled.
	/// </summary>
	public DateTime? NextMetadataRefresh { get; set; }

	public static DateTime ComputeNextRefreshDate(DateOnly airDate)
	{
		int days = DateOnly.FromDateTime(DateTime.UtcNow).DayNumber - airDate.DayNumber;
		return days switch
		{
			<= 4 => DateTime.UtcNow.AddDays(1),
			<= 21 => DateTime.UtcNow.AddDays(14),
			_ => DateTime.UtcNow.AddMonths(2)
		};
	}
}
