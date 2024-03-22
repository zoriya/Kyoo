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

using Kyoo.Abstractions.Models.Permissions;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Kyoo.Abstractions.Controllers;

/// <summary>
/// A service to validate permissions.
/// </summary>
public interface IPermissionValidator
{
	/// <summary>
	/// Create an IAuthorizationFilter that will be used to validate permissions.
	/// This can registered with any lifetime.
	/// </summary>
	/// <param name="attribute">The permission attribute to validate.</param>
	/// <returns>An authorization filter used to validate the permission.</returns>
	IFilterMetadata Create(PermissionAttribute attribute);

	/// <summary>
	/// Create an IAuthorizationFilter that will be used to validate permissions.
	/// This can registered with any lifetime.
	/// </summary>
	/// <param name="attribute">
	/// A partial attribute to validate. See <see cref="PartialPermissionAttribute"/>.
	/// </param>
	/// <returns>An authorization filter used to validate the permission.</returns>
	IFilterMetadata Create(PartialPermissionAttribute attribute);
}
