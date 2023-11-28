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

namespace Kyoo.Abstractions.Controllers
{
	/// <summary>
	/// Information about the pagination. How many items should be displayed and where to start.
	/// </summary>
	public class Pagination
	{
		/// <summary>
		/// The count of items to return.
		/// </summary>
		public int Limit { get; set; }

		/// <summary>
		/// Where to start? Using the given sort.
		/// </summary>
		public Guid? AfterID { get; set; }

		/// <summary>
		/// Should the previous page be returned instead of the next?
		/// </summary>
		public bool Reverse { get; set; }

		/// <summary>
		/// Create a new <see cref="Pagination"/> with default values.
		/// </summary>
		public Pagination()
		{
			Limit = 50;
			AfterID = null;
			Reverse = false;
		}

		/// <summary>
		/// Create a new <see cref="Pagination"/> instance.
		/// </summary>
		/// <param name="count">Set the <see cref="Limit"/> value</param>
		/// <param name="afterID">Set the <see cref="AfterID"/> value. If not specified, it will start from the start</param>
		/// <param name="reverse">Should the previous page be returned instead of the next?</param>
		public Pagination(int count, Guid? afterID = null, bool reverse = false)
		{
			Limit = count;
			AfterID = afterID;
			Reverse = reverse;
		}

		/// <summary>
		/// Implicitly create a new pagination from a limit number.
		/// </summary>
		/// <param name="limit">Set the <see cref="Limit"/> value</param>
		/// <returns>A new <see cref="Pagination"/> instance</returns>
		public static implicit operator Pagination(int limit) => new(limit);
	}
}
