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
using JetBrains.Annotations;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Abstractions.Models.Attributes
{
	/// <summary>
	/// A custom <see cref="RouteAttribute"/> that indicate an alternatives, hidden route.
	/// </summary>
	[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
	public class AltRouteAttribute : RouteAttribute
	{
		/// <summary>
		/// Create a new <see cref="AltRouteAttribute"/>.
		/// </summary>
		/// <param name="template">The route template, see <see cref="RouteAttribute.Template"/>.</param>
		public AltRouteAttribute([NotNull] [RouteTemplateAttribute] string template)
			: base(template)
		{ }
	}
}
