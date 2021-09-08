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
using Kyoo.Abstractions.Controllers;

namespace Kyoo.Abstractions.Models.Attributes
{
	/// <summary>
	/// The targeted relation can be loaded via a call to <see cref="ILibraryManager.Load"/>.
	/// </summary>
	[AttributeUsage(AttributeTargets.Property)]
	public class LoadableRelationAttribute : Attribute
	{
		/// <summary>
		/// The name of the field containing the related resource's ID.
		/// </summary>
		public string RelationID { get; }

		/// <summary>
		/// Create a new <see cref="LoadableRelationAttribute"/>.
		/// </summary>
		public LoadableRelationAttribute() { }

		/// <summary>
		/// Create a new <see cref="LoadableRelationAttribute"/> with a baking relationID field.
		/// </summary>
		/// <param name="relationID">The name of the RelationID field.</param>
		public LoadableRelationAttribute(string relationID)
		{
			RelationID = relationID;
		}
	}
}
