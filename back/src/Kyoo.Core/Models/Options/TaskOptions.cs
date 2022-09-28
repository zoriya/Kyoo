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
using JetBrains.Annotations;

namespace Kyoo.Core.Models.Options
{
	/// <summary>
	/// Options related to tasks
	/// </summary>
	public class TaskOptions
	{
		/// <summary>
		/// The path of this options
		/// </summary>
		public const string Path = "Tasks";

		/// <summary>
		/// The number of tasks that can be run concurrently.
		/// </summary>
		public int Parallels { get; set; }

		/// <summary>
		/// The delay of tasks that should be automatically started at fixed times.
		/// </summary>
		[UsedImplicitly]
		public Dictionary<string, TimeSpan> Scheduled { get; set; } = new();
	}
}
