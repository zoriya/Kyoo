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

using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Abstractions.Models;

/// <summary>
/// A watch list item.
/// </summary>
[OneOf(Types = new[] { typeof(Show), typeof(Movie), typeof(Episode) })]
public interface IWatchlist : IResource, IThumbnails, IMetadata, IAddedDate, IQuery
{
	static Sort IQuery.DefaultSort => new Sort<IWatchlist>.By(nameof(AddedDate), true);
}
