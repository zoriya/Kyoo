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

namespace Kyoo.Meiliseach
{
	public class MeilisearchModule : IPlugin
	{
		/// <inheritdoc />
		public string Name => "Meilisearch";

		private readonly IConfiguration _configuration;

		public MeilisearchModule(IConfiguration configuration)
		{
			_configuration = configuration;
		}

		/// <summary>
		/// Init meilisearch indexes.
		/// </summary>
		/// <param name="provider">The service list to retrieve the meilisearch client</param>
		public static async Task Initialize(IServiceProvider provider)
		{
			MeilisearchClient client = provider.GetRequiredService<MeilisearchClient>();

			await _CreateIndex(client, "items", new Settings()
			{
				SearchableAttributes = new[]
				{
					nameof(LibraryItem.Name),
					nameof(LibraryItem.Slug),
					nameof(LibraryItem.Aliases),
					nameof(LibraryItem.Path),
					nameof(LibraryItem.Tags),
					// Overview could be included as well but I think it would be better without.
				},
				FilterableAttributes = new[]
				{
					nameof(LibraryItem.Genres),
					nameof(LibraryItem.Status),
					nameof(LibraryItem.AirDate),
					nameof(LibraryItem.StudioID),
				},
				SortableAttributes = new[]
				{
					nameof(LibraryItem.AirDate),
					nameof(LibraryItem.AddedDate),
					nameof(LibraryItem.Kind),
				},
				DisplayedAttributes = new[] { nameof(LibraryItem.Id) },
				// TODO: Add stopwords
				// TODO: Extend default ranking to add ratings.
			});
		}

		private static async Task _CreateIndex(MeilisearchClient client, string index, Settings opts)
		{
			TaskInfo task = await client.CreateIndexAsync(index, "Id");
			await client.WaitForTaskAsync(task.TaskUid);
			await client.Index(index).UpdateSettingsAsync(opts);
		}

		/// <inheritdoc />
		public void Configure(ContainerBuilder builder)
		{
			builder.RegisterInstance(new MeilisearchClient(
				_configuration.GetValue("MEILI_HOST", "http://meilisearch:7700"),
				_configuration.GetValue<string?>("MEILI_MASTER_KEY")
			)).InstancePerLifetimeScope();
			builder.RegisterType<SearchManager>().InstancePerLifetimeScope();
		}
	}
}
