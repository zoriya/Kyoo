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

using System.Diagnostics.CodeAnalysis;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Permissions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A permission validator that always validate permissions. This effectively disable the permission system.
	/// </summary>
	public class PassthroughPermissionValidator : IPermissionValidator
	{
		[SuppressMessage("ReSharper", "SuggestBaseTypeForParameterInConstructor",
			Justification = "ILogger should include the typeparam for context.")]
		public PassthroughPermissionValidator(ILogger<PassthroughPermissionValidator> logger)
		{
			logger.LogWarning("No permission validator has been enabled, all users will have all permissions");
		}

		/// <inheritdoc />
		public IFilterMetadata Create(PermissionAttribute attribute)
		{
			return new PassthroughValidator();
		}

		/// <inheritdoc />
		public IFilterMetadata Create(PartialPermissionAttribute attribute)
		{
			return new PassthroughValidator();
		}

		/// <summary>
		/// An useless filter that does nothing.
		/// </summary>
		private class PassthroughValidator : IFilterMetadata { }
	}
}
