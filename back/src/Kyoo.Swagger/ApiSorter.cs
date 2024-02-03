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

using System.Collections.Generic;
using System.Linq;
using Kyoo.Swagger.Models;
using NSwag;
using NSwag.Generation.AspNetCore;

namespace Kyoo.Swagger
{
	/// <summary>
	/// A class to sort apis.
	/// </summary>
	public static class ApiSorter
	{
		/// <summary>
		/// Sort apis by alphabetical orders.
		/// </summary>
		/// <param name="options">The swagger settings to update.</param>
		public static void SortApis(this AspNetCoreOpenApiDocumentGeneratorSettings options)
		{
			options.PostProcess += postProcess =>
			{
				// We can't reorder items by assigning the sorted value to the Paths variable since it has no setter.
				List<KeyValuePair<string, OpenApiPathItem>> sorted = postProcess
					.Paths.OrderBy(x => x.Key)
					.ToList();
				postProcess.Paths.Clear();
				foreach ((string key, OpenApiPathItem value) in sorted)
					postProcess.Paths.Add(key, value);
			};

			options.PostProcess += postProcess =>
			{
				if (!postProcess.ExtensionData.TryGetValue("x-tagGroups", out object list))
					return;
				List<TagGroups> tagGroups = (List<TagGroups>)list;
				postProcess.ExtensionData["x-tagGroups"] = tagGroups
					.OrderBy(x => x.Name)
					.Select(x =>
					{
						x.Name = x.Name[(x.Name.IndexOf(':') + 1)..];
						x.Tags = x.Tags.OrderBy(y => y).ToList();
						return x;
					})
					.ToList();
			};
		}
	}
}
