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
using System.Collections.Generic;
using System.Data.Common;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Postgresql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using static System.Text.Json.JsonNamingPolicy;

namespace Kyoo.Core.Controllers;

public class MiscRepository(
	DatabaseContext context,
	DbConnection database,
	IThumbnailsManager thumbnails
)
{
	public static async Task DownloadMissingImages(IServiceProvider services)
	{
		await using AsyncServiceScope scope = services.CreateAsyncScope();
		await scope.ServiceProvider.GetRequiredService<MiscRepository>().DownloadMissingImages();
	}

	private async Task<ICollection<Image>> _GetAllImages()
	{
		string GetSql(string type) =>
			$"""
				select poster from {type}
				union all select thumbnail from {type}
				union all select logo from {type}
				""";
		var queries = new string[]
		{
			"movies",
			"collections",
			"shows",
			"seasons",
			"episodes"
		}.Select(x => GetSql(x));
		string sql = string.Join(" union all ", queries);
		IEnumerable<Image?> ret = await database.QueryAsync<Image?>(sql);
		return ret.Where(x => x != null).ToArray() as Image[];
	}

	public async Task DownloadMissingImages()
	{
		ICollection<Image> images = await _GetAllImages();
		IEnumerable<Task> tasks = images
			.Where(x => !File.Exists(thumbnails.GetImagePath(x.Id, ImageQuality.Low)))
			.Select(x => thumbnails.DownloadImage(x, x.Id.ToString()));
		// Chunk tasks to prevent http timouts
		foreach (IEnumerable<Task> batch in tasks.Chunk(30))
			await Task.WhenAll(batch);
	}

	public async Task<ICollection<string>> GetRegisteredPaths()
	{
		return await context
			.Episodes.Select(x => x.Path)
			.Concat(context.Movies.Select(x => x.Path))
			.ToListAsync();
	}

	public async Task<ICollection<RefreshableItem>> GetRefreshableItems(DateTime end)
	{
		IQueryable<RefreshableItem> GetItems<T>()
			where T : class, IResource, IRefreshable
		{
			return context
				.Set<T>()
				.Select(x => new RefreshableItem
				{
					Kind = CamelCase.ConvertName(typeof(T).Name),
					Id = x.Id,
					RefreshDate = x.NextMetadataRefresh!.Value
				});
		}

		return await GetItems<Show>()
			.Concat(GetItems<Movie>())
			.Concat(GetItems<Season>())
			.Concat(GetItems<Episode>())
			.Concat(GetItems<Collection>())
			.Where(x => x.RefreshDate <= end)
			.OrderBy(x => x.RefreshDate)
			.ToListAsync();
	}
}

public class RefreshableItem
{
	public string Kind { get; set; }

	public Guid Id { get; set; }

	public DateTime RefreshDate { get; set; }
}
