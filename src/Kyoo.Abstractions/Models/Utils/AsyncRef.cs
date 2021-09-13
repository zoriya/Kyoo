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
	/// A class wrapping a value that will be set after the completion of the task it is related to.
	/// </summary>
	/// <remarks>
	/// This class replace the use of an out parameter on a task since tasks and out can't be combined.
	/// </remarks>
	/// <typeparam name="T">The type of the value</typeparam>
	public class AsyncRef<T>
	{
		/// <summary>
		/// The value that will be set before the completion of the task.
		/// </summary>
		public T Value { get; set; }
	}
}
