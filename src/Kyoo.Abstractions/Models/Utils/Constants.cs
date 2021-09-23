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

using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Abstractions.Models.Utils
{
	/// <summary>
	/// A class containing constant numbers.
	/// </summary>
	public static class Constants
	{
		/// <summary>
		/// A property to use on a Microsoft.AspNet.MVC.Route.Order property to mark it as an alternative route
		/// that won't be included on the swagger.
		/// </summary>
		public const int AlternativeRoute = 1;

		/// <summary>
		/// A group name for <see cref="ApiDefinitionAttribute"/>. It should be used for every <see cref="IResource"/>.
		/// </summary>
		public const string ResourceGroup = "Resources";
	}
}
