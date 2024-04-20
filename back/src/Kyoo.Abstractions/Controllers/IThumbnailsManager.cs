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
using System.IO;
using System.Threading.Tasks;
using Kyoo.Abstractions.Models;

namespace Kyoo.Abstractions.Controllers;

public interface IThumbnailsManager
{
	Task DownloadImages<T>(T item)
		where T : IThumbnails;

	string GetImagePath(Guid imageId, ImageQuality quality);

	Task DeleteImages<T>(T item)
		where T : IThumbnails;

	Task<Stream> GetUserImage(Guid userId);

	Task SetUserImage(Guid userId, Stream? image);
}
