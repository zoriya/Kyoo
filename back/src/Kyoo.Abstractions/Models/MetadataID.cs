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
using System.Linq.Expressions;
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// ID and link of an item on an external provider.
	/// </summary>
	public class MetadataID
	{
		/// <summary>
		/// The expression to retrieve the unique ID of a MetadataID. This is an aggregate of the two resources IDs.
		/// </summary>
		public static Expression<Func<MetadataID, object>> PrimaryKey
		{
			get { return x => new { First = x.ResourceID, Second = x.ProviderID }; }
		}

		/// <summary>
		/// The ID of the resource which possess the metadata.
		/// </summary>
		[SerializeIgnore] public int ResourceID { get; set; }

		/// <summary>
		/// The ID of the provider.
		/// </summary>
		[SerializeIgnore] public int ProviderID { get; set; }

		/// <summary>
		/// The provider that can do something with this ID.
		/// </summary>
		public Provider Provider { get; set; }

		/// <summary>
		/// The ID of the resource on the external provider.
		/// </summary>
		public string DataID { get; set; }

		/// <summary>
		/// The URL of the resource on the external provider.
		/// </summary>
		public string Link { get; set; }
	}
}
