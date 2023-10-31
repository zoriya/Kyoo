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

using Autofac;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Meilisearch;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using static System.Text.Json.JsonNamingPolicy;

namespace Kyoo.Meiliseach
{
	public class MeilisearchModule : IPlugin
	{
		/// <inheritdoc />
		public string Name => "Meilisearch";

		private readonly IConfiguration _configuration;

		public static Dictionary<string, Settings> IndexSettings => new()
		{
			{
				"items",
				new Settings()
				{
					SearchableAttributes = new[]
					{
						CamelCase.ConvertName(nameof(LibraryItem.Name)),
						CamelCase.ConvertName(nameof(LibraryItem.Slug)),
						CamelCase.ConvertName(nameof(LibraryItem.Aliases)),
						CamelCase.ConvertName(nameof(LibraryItem.Path)),
						CamelCase.ConvertName(nameof(LibraryItem.Tags)),
						CamelCase.ConvertName(nameof(LibraryItem.Overview)),
					},
					FilterableAttributes = new[]
					{
						CamelCase.ConvertName(nameof(LibraryItem.Genres)),
						CamelCase.ConvertName(nameof(LibraryItem.Status)),
						CamelCase.ConvertName(nameof(LibraryItem.AirDate)),
						CamelCase.ConvertName(nameof(Movie.StudioID)),
						CamelCase.ConvertName(nameof(LibraryItem.Kind)),
					},
					SortableAttributes = new[]
					{
						CamelCase.ConvertName(nameof(LibraryItem.AirDate)),
						CamelCase.ConvertName(nameof(LibraryItem.AddedDate)),
						CamelCase.ConvertName(nameof(LibraryItem.Rating)),
					},
					DisplayedAttributes = new[]
					{
						CamelCase.ConvertName(nameof(LibraryItem.Id)),
						CamelCase.ConvertName(nameof(LibraryItem.Kind)),
					},
					RankingRules = new[]
					{
						"words",
						"typo",
						"proximity",
						"attribute",
						"sort",
						"exactness",
						$"{CamelCase.ConvertName(nameof(LibraryItem.Rating))}:desc",
					}
					// TODO: Add stopwords
					// TODO: Extend default ranking to add ratings.
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
					DisplayedAttributes = new[]
					{
						CamelCase.ConvertName(nameof(Episode.Id)),
					},
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
					DisplayedAttributes = new[]
					{
						CamelCase.ConvertName(nameof(Studio.Id)),
					},
					// TODO: Add stopwords
				}
			},
		};

		public MeilisearchModule(IConfiguration configuration)
		{
			_configuration = configuration;
		}

		/// <summary>
		/// Init meilisearch indexes.
		/// </summary>
		/// <param name="provider">The service list to retrieve the meilisearch client</param>
		/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
		public static async Task Initialize(IServiceProvider provider)
		{
			MeilisearchClient client = provider.GetRequiredService<MeilisearchClient>();

			await _CreateIndex(client, "items", true);
			await _CreateIndex(client, nameof(Episode), false);
			await _CreateIndex(client, nameof(Studio), false);

			IndexStats info = await client.Index("items").GetStatsAsync();
			// If there is no documents in meilisearch, if a db exist and is not empty, add items to meilisearch.
			if (info.NumberOfDocuments == 0)
			{
				ILibraryManager database = provider.GetRequiredService<ILibraryManager>();
				SearchManager search = provider.GetRequiredService<SearchManager>();

				// This is a naive implementation that absolutly does not care about performances.
				// This will run only once on users that already had a database when they upgrade.
				foreach (Movie movie in await database.Movies.GetAll(limit: 0))
					await search.CreateOrUpdate("items", movie, nameof(Movie));
				foreach (Show show in await database.Shows.GetAll(limit: 0))
					await search.CreateOrUpdate("items", show, nameof(Show));
				foreach (Collection collection in await database.Collections.GetAll(limit: 0))
					await search.CreateOrUpdate("items", collection, nameof(Collection));
				foreach (Episode episode in await database.Episodes.GetAll(limit: 0))
					await search.CreateOrUpdate(nameof(Episode), episode);
				foreach (Studio studio in await database.Studios.GetAll(limit: 0))
					await search.CreateOrUpdate(nameof(Studio), studio);
			}
		}

		private static async Task _CreateIndex(MeilisearchClient client, string index, bool hasKind)
		{
			TaskInfo task = await client.CreateIndexAsync(index, hasKind ? "ref" : CamelCase.ConvertName(nameof(IResource.Id)));
			await client.WaitForTaskAsync(task.TaskUid);
			await client.Index(index).UpdateSettingsAsync(IndexSettings[index]);
		}

		/// <inheritdoc />
		public void Configure(ContainerBuilder builder)
		{
			builder.RegisterInstance(new MeilisearchClient(
				_configuration.GetValue("MEILI_HOST", "http://meilisearch:7700"),
				_configuration.GetValue<string?>("MEILI_MASTER_KEY")
			)).SingleInstance();
			builder.RegisterType<SearchManager>().AsSelf().As<ISearchManager>()
				.SingleInstance()
				.AutoActivate();
		}
	}
}
