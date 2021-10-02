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

namespace Kyoo.Abstractions.Models.Attributes
{
	/// <summary>
	/// An attribute to specify on apis to specify it's documentation's name and category.
	/// If this is applied on a method, the specified method will be exploded from the controller's page and be
	/// included on the specified tag page.
	/// </summary>
	[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
	public class ApiDefinitionAttribute : Attribute
	{
		/// <summary>
		/// The public name of this api.
		/// </summary>
		[NotNull] public string Name { get; }

		/// <summary>
		/// The name of the group in witch this API is. You can also specify a custom sort order using the following
		/// format: <code>order:name</code>. Everything before the first <c>:</c> will be removed but kept for
		/// th alphabetical ordering.
		/// </summary>
		public string Group { get; set; }

		/// <summary>
		/// Create a new <see cref="ApiDefinitionAttribute"/>.
		/// </summary>
		/// <param name="name">The name of the api that will be used on the documentation page.</param>
		public ApiDefinitionAttribute([NotNull] string name)
		{
			if (name == null)
				throw new ArgumentNullException(nameof(name));
			Name = name;
		}
	}
}
