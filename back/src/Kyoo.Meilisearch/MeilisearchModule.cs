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
using Kyoo.Abstractions.Models;
using Meilisearch;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using static System.Text.Json.JsonNamingPolicy;

namespace Kyoo.Meiliseach;

public static class MeilisearchModule
{
	public static Dictionary<string, Settings> IndexSettings =>
		new()
		{
			{
				"items",
				new Settings()
				{
					SearchableAttributes = new[]
					{
						CamelCase.ConvertName(nameof(Movie.Name)),
						CamelCase.ConvertName(nameof(Movie.Slug)),
						CamelCase.ConvertName(nameof(Movie.Aliases)),
						CamelCase.ConvertName(nameof(Movie.Path)),
						CamelCase.ConvertName(nameof(Movie.Tags)),
						CamelCase.ConvertName(nameof(Movie.Overview)),
					},
					FilterableAttributes = new[]
					{
						CamelCase.ConvertName(nameof(Movie.Genres)),
						CamelCase.ConvertName(nameof(Movie.Status)),
						CamelCase.ConvertName(nameof(Movie.AirDate)),
						CamelCase.ConvertName(nameof(Show.StartAir)),
						CamelCase.ConvertName(nameof(Show.EndAir)),
						CamelCase.ConvertName(nameof(Movie.StudioId)),
						"kind"
					},
					SortableAttributes = new[]
					{
						CamelCase.ConvertName(nameof(Movie.AirDate)),
						CamelCase.ConvertName(nameof(Movie.AddedDate)),
						CamelCase.ConvertName(nameof(Movie.Rating)),
						CamelCase.ConvertName(nameof(Movie.Runtime)),
					},
					DisplayedAttributes = new[] { CamelCase.ConvertName(nameof(Movie.Id)), "kind" },
					RankingRules = new[]
					{
						"words",
						"typo",
						"proximity",
						"attribute",
						"sort",
						"exactness",
						$"{CamelCase.ConvertName(nameof(Movie.Rating))}:desc",
					}
					// TODO: Add stopwords
				}
			},
			{
				nameof(Episode),
				new Settings()
				{
					SearchableAttributes = new[]
					{
						CamelCase.ConvertName(nameof(Episode.Name)),
						CamelCase.ConvertName(nameof(Episode.Overview)),
						CamelCase.ConvertName(nameof(Episode.Slug)),
						CamelCase.ConvertName(nameof(Episode.Path)),
					},
					FilterableAttributes = new[]
					{
						CamelCase.ConvertName(nameof(Episode.SeasonNumber)),
					},
					SortableAttributes = new[]
					{
						CamelCase.ConvertName(nameof(Episode.ReleaseDate)),
						CamelCase.ConvertName(nameof(Episode.AddedDate)),
						CamelCase.ConvertName(nameof(Episode.SeasonNumber)),
						CamelCase.ConvertName(nameof(Episode.EpisodeNumber)),
						CamelCase.ConvertName(nameof(Episode.AbsoluteNumber)),
					},
					DisplayedAttributes = new[] { CamelCase.ConvertName(nameof(Episode.Id)), },
					// TODO: Add stopwords
				}
			},
			{
				nameof(Studio),
				new Settings()
				{
					SearchableAttributes = new[]
					{
						CamelCase.ConvertName(nameof(Studio.Name)),
						CamelCase.ConvertName(nameof(Studio.Slug)),
					},
					FilterableAttributes = Array.Empty<string>(),
					SortableAttributes = Array.Empty<string>(),
					DisplayedAttributes = new[] { CamelCase.ConvertName(nameof(Studio.Id)), },
					// TODO: Add stopwords
				}
			},
		};

	public static async Task Initialize(IServiceProvider provider)
	{
		MeilisearchClient client = provider.GetRequiredService<MeilisearchClient>();

		await _CreateIndex(client, "items", true);
		await _CreateIndex(client, nameof(Episode), false);
		await _CreateIndex(client, nameof(Studio), false);
	}

	public static async Task SyncDatabase(IServiceProvider provider)
	{
		await using AsyncServiceScope scope = provider.CreateAsyncScope();
		ILibraryManager database = scope.ServiceProvider.GetRequiredService<ILibraryManager>();
		await scope.ServiceProvider.GetRequiredService<MeiliSync>().SyncEverything(database);
	}

	private static async Task _CreateIndex(MeilisearchClient client, string index, bool hasKind)
	{
		TaskInfo task = await client.CreateIndexAsync(
			index,
			hasKind ? "ref" : CamelCase.ConvertName(nameof(IResource.Id))
		);
		await client.WaitForTaskAsync(task.TaskUid);
		await client.Index(index).UpdateSettingsAsync(IndexSettings[index]);
	}

	/// <inheritdoc />
	public static void ConfigureMeilisearch(this WebApplicationBuilder builder)
	{
		builder.Services.AddSingleton(
			new MeilisearchClient(
				builder.Configuration.GetValue("MEILI_HOST", "http://meilisearch:7700"),
				builder.Configuration.GetValue<string?>("MEILI_MASTER_KEY")
			)
		);
		builder.Services.AddScoped<ISearchManager, SearchManager>();
		builder.Services.AddSingleton<MeiliSync>();
	}
}
