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
using System.Linq;

namespace Kyoo.Abstractions.Models.Utils
{
	/// <summary>
	/// The list of errors that where made in the request.
	/// </summary>
	public class RequestError
	{
		/// <summary>
		/// The list of errors that where made in the request.
		/// </summary>
		/// <example><c>["InvalidFilter: no field 'startYear' on a collection"]</c></example>
		public string[] Errors { get; set; }

		/// <summary>
		/// Create a new <see cref="RequestError"/> with one error.
		/// </summary>
		/// <param name="error">The error to specify in the response.</param>
		public RequestError(string error)
		{
			if (error == null)
				throw new ArgumentNullException(nameof(error));
			Errors = new[] { error };
		}

		/// <summary>
		/// Create a new <see cref="RequestError"/> with multiple errors.
		/// </summary>
		/// <param name="errors">The errors to specify in the response.</param>
		public RequestError(string[] errors)
		{
			if (errors == null || !errors.Any())
				throw new ArgumentException(
					"Errors must be non null and not empty",
					nameof(errors)
				);
			Errors = errors;
		}
	}
}
