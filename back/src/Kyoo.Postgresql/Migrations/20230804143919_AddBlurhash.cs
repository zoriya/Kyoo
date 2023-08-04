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
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Kyoo.Postgresql.Migrations
{
	/// <inheritdoc />
	public partial class AddBlurhash : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			MigrationHelper.DropLibraryItemsView(migrationBuilder);

			migrationBuilder.DropTable(
				name: "collection_metadata_id");

			migrationBuilder.DropTable(
				name: "episode_metadata_id");

			migrationBuilder.DropTable(
				name: "link_library_provider");

			migrationBuilder.DropTable(
				name: "people_metadata_id");

			migrationBuilder.DropTable(
				name: "season_metadata_id");

			migrationBuilder.DropTable(
				name: "show_metadata_id");

			migrationBuilder.DropTable(
				name: "studio_metadata_id");

			migrationBuilder.DropTable(
				name: "providers");

			migrationBuilder.DropColumn(
				name: "images",
				table: "users");

			migrationBuilder.DropColumn(
				name: "images",
				table: "shows");

			migrationBuilder.DropColumn(
				name: "images",
				table: "seasons");

			migrationBuilder.DropColumn(
				name: "images",
				table: "people");

			migrationBuilder.DropColumn(
				name: "images",
				table: "episodes");

			migrationBuilder.DropColumn(
				name: "images",
				table: "collections");

			migrationBuilder.AddColumn<string>(
				name: "logo_blurhash",
				table: "users",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "logo_source",
				table: "users",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "external_id",
				table: "studios",
				type: "json",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "external_id",
				table: "shows",
				type: "json",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "logo_blurhash",
				table: "shows",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "logo_source",
				table: "shows",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "poster_blurhash",
				table: "shows",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "poster_source",
				table: "shows",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_blurhash",
				table: "shows",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_source",
				table: "shows",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "trailer",
				table: "shows",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "external_id",
				table: "seasons",
				type: "json",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "logo_blurhash",
				table: "seasons",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "logo_source",
				table: "seasons",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "poster_blurhash",
				table: "seasons",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "poster_source",
				table: "seasons",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_blurhash",
				table: "seasons",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_source",
				table: "seasons",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "external_id",
				table: "people",
				type: "json",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "logo_blurhash",
				table: "people",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "logo_source",
				table: "people",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "poster_blurhash",
				table: "people",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "poster_source",
				table: "people",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_blurhash",
				table: "people",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_source",
				table: "people",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "external_id",
				table: "episodes",
				type: "json",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "logo_blurhash",
				table: "episodes",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "logo_source",
				table: "episodes",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "poster_blurhash",
				table: "episodes",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "poster_source",
				table: "episodes",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_blurhash",
				table: "episodes",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_source",
				table: "episodes",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "external_id",
				table: "collections",
				type: "json",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "logo_blurhash",
				table: "collections",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "logo_source",
				table: "collections",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "poster_blurhash",
				table: "collections",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "poster_source",
				table: "collections",
				type: "text",
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_blurhash",
				table: "collections",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true);

			migrationBuilder.AddColumn<string>(
				name: "thumbnail_source",
				table: "collections",
				type: "text",
				nullable: true);

			MigrationHelper.CreateLibraryItemsView(migrationBuilder);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			MigrationHelper.DropLibraryItemsView(migrationBuilder);

			migrationBuilder.DropColumn(
				name: "logo_blurhash",
				table: "users");

			migrationBuilder.DropColumn(
				name: "logo_source",
				table: "users");

			migrationBuilder.DropColumn(
				name: "external_id",
				table: "studios");

			migrationBuilder.DropColumn(
				name: "external_id",
				table: "shows");

			migrationBuilder.DropColumn(
				name: "logo_blurhash",
				table: "shows");

			migrationBuilder.DropColumn(
				name: "logo_source",
				table: "shows");

			migrationBuilder.DropColumn(
				name: "poster_blurhash",
				table: "shows");

			migrationBuilder.DropColumn(
				name: "poster_source",
				table: "shows");

			migrationBuilder.DropColumn(
				name: "thumbnail_blurhash",
				table: "shows");

			migrationBuilder.DropColumn(
				name: "thumbnail_source",
				table: "shows");

			migrationBuilder.DropColumn(
				name: "trailer",
				table: "shows");

			migrationBuilder.DropColumn(
				name: "external_id",
				table: "seasons");

			migrationBuilder.DropColumn(
				name: "logo_blurhash",
				table: "seasons");

			migrationBuilder.DropColumn(
				name: "logo_source",
				table: "seasons");

			migrationBuilder.DropColumn(
				name: "poster_blurhash",
				table: "seasons");

			migrationBuilder.DropColumn(
				name: "poster_source",
				table: "seasons");

			migrationBuilder.DropColumn(
				name: "thumbnail_blurhash",
				table: "seasons");

			migrationBuilder.DropColumn(
				name: "thumbnail_source",
				table: "seasons");

			migrationBuilder.DropColumn(
				name: "external_id",
				table: "people");

			migrationBuilder.DropColumn(
				name: "logo_blurhash",
				table: "people");

			migrationBuilder.DropColumn(
				name: "logo_source",
				table: "people");

			migrationBuilder.DropColumn(
				name: "poster_blurhash",
				table: "people");

			migrationBuilder.DropColumn(
				name: "poster_source",
				table: "people");

			migrationBuilder.DropColumn(
				name: "thumbnail_blurhash",
				table: "people");

			migrationBuilder.DropColumn(
				name: "thumbnail_source",
				table: "people");

			migrationBuilder.DropColumn(
				name: "external_id",
				table: "episodes");

			migrationBuilder.DropColumn(
				name: "logo_blurhash",
				table: "episodes");

			migrationBuilder.DropColumn(
				name: "logo_source",
				table: "episodes");

			migrationBuilder.DropColumn(
				name: "poster_blurhash",
				table: "episodes");

			migrationBuilder.DropColumn(
				name: "poster_source",
				table: "episodes");

			migrationBuilder.DropColumn(
				name: "thumbnail_blurhash",
				table: "episodes");

			migrationBuilder.DropColumn(
				name: "thumbnail_source",
				table: "episodes");

			migrationBuilder.DropColumn(
				name: "external_id",
				table: "collections");

			migrationBuilder.DropColumn(
				name: "logo_blurhash",
				table: "collections");

			migrationBuilder.DropColumn(
				name: "logo_source",
				table: "collections");

			migrationBuilder.DropColumn(
				name: "poster_blurhash",
				table: "collections");

			migrationBuilder.DropColumn(
				name: "poster_source",
				table: "collections");

			migrationBuilder.DropColumn(
				name: "thumbnail_blurhash",
				table: "collections");

			migrationBuilder.DropColumn(
				name: "thumbnail_source",
				table: "collections");

			migrationBuilder.AddColumn<Dictionary<int, string>>(
				name: "images",
				table: "users",
				type: "jsonb",
				nullable: true);

			migrationBuilder.AddColumn<Dictionary<int, string>>(
				name: "images",
				table: "shows",
				type: "jsonb",
				nullable: true);

			migrationBuilder.AddColumn<Dictionary<int, string>>(
				name: "images",
				table: "seasons",
				type: "jsonb",
				nullable: true);

			migrationBuilder.AddColumn<Dictionary<int, string>>(
				name: "images",
				table: "people",
				type: "jsonb",
				nullable: true);

			migrationBuilder.AddColumn<Dictionary<int, string>>(
				name: "images",
				table: "episodes",
				type: "jsonb",
				nullable: true);

			migrationBuilder.AddColumn<Dictionary<int, string>>(
				name: "images",
				table: "collections",
				type: "jsonb",
				nullable: true);

			migrationBuilder.CreateTable(
				name: "providers",
				columns: table => new
				{
					id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					images = table.Column<Dictionary<int, string>>(type: "jsonb", nullable: true),
					name = table.Column<string>(type: "text", nullable: true),
					slug = table.Column<string>(type: "text", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_providers", x => x.id);
				});

			migrationBuilder.CreateTable(
				name: "collection_metadata_id",
				columns: table => new
				{
					resource_id = table.Column<int>(type: "integer", nullable: false),
					provider_id = table.Column<int>(type: "integer", nullable: false),
					data_id = table.Column<string>(type: "text", nullable: true),
					link = table.Column<string>(type: "text", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_collection_metadata_id", x => new { x.resource_id, x.provider_id });
					table.ForeignKey(
						name: "fk_collection_metadata_id_collections_collection_id",
						column: x => x.resource_id,
						principalTable: "collections",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_collection_metadata_id_providers_provider_id",
						column: x => x.provider_id,
						principalTable: "providers",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "episode_metadata_id",
				columns: table => new
				{
					resource_id = table.Column<int>(type: "integer", nullable: false),
					provider_id = table.Column<int>(type: "integer", nullable: false),
					data_id = table.Column<string>(type: "text", nullable: true),
					link = table.Column<string>(type: "text", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_episode_metadata_id", x => new { x.resource_id, x.provider_id });
					table.ForeignKey(
						name: "fk_episode_metadata_id_episodes_episode_id",
						column: x => x.resource_id,
						principalTable: "episodes",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_episode_metadata_id_providers_provider_id",
						column: x => x.provider_id,
						principalTable: "providers",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "link_library_provider",
				columns: table => new
				{
					library_id = table.Column<int>(type: "integer", nullable: false),
					provider_id = table.Column<int>(type: "integer", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_link_library_provider", x => new { x.library_id, x.provider_id });
					table.ForeignKey(
						name: "fk_link_library_provider_libraries_library_id",
						column: x => x.library_id,
						principalTable: "libraries",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_link_library_provider_providers_provider_id",
						column: x => x.provider_id,
						principalTable: "providers",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "people_metadata_id",
				columns: table => new
				{
					resource_id = table.Column<int>(type: "integer", nullable: false),
					provider_id = table.Column<int>(type: "integer", nullable: false),
					data_id = table.Column<string>(type: "text", nullable: true),
					link = table.Column<string>(type: "text", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_people_metadata_id", x => new { x.resource_id, x.provider_id });
					table.ForeignKey(
						name: "fk_people_metadata_id_people_people_id",
						column: x => x.resource_id,
						principalTable: "people",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_people_metadata_id_providers_provider_id",
						column: x => x.provider_id,
						principalTable: "providers",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "season_metadata_id",
				columns: table => new
				{
					resource_id = table.Column<int>(type: "integer", nullable: false),
					provider_id = table.Column<int>(type: "integer", nullable: false),
					data_id = table.Column<string>(type: "text", nullable: true),
					link = table.Column<string>(type: "text", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_season_metadata_id", x => new { x.resource_id, x.provider_id });
					table.ForeignKey(
						name: "fk_season_metadata_id_providers_provider_id",
						column: x => x.provider_id,
						principalTable: "providers",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_season_metadata_id_seasons_season_id",
						column: x => x.resource_id,
						principalTable: "seasons",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "show_metadata_id",
				columns: table => new
				{
					resource_id = table.Column<int>(type: "integer", nullable: false),
					provider_id = table.Column<int>(type: "integer", nullable: false),
					data_id = table.Column<string>(type: "text", nullable: true),
					link = table.Column<string>(type: "text", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_show_metadata_id", x => new { x.resource_id, x.provider_id });
					table.ForeignKey(
						name: "fk_show_metadata_id_providers_provider_id",
						column: x => x.provider_id,
						principalTable: "providers",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_show_metadata_id_shows_show_id",
						column: x => x.resource_id,
						principalTable: "shows",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "studio_metadata_id",
				columns: table => new
				{
					resource_id = table.Column<int>(type: "integer", nullable: false),
					provider_id = table.Column<int>(type: "integer", nullable: false),
					data_id = table.Column<string>(type: "text", nullable: true),
					link = table.Column<string>(type: "text", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_studio_metadata_id", x => new { x.resource_id, x.provider_id });
					table.ForeignKey(
						name: "fk_studio_metadata_id_providers_provider_id",
						column: x => x.provider_id,
						principalTable: "providers",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_studio_metadata_id_studios_studio_id",
						column: x => x.resource_id,
						principalTable: "studios",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateIndex(
				name: "ix_collection_metadata_id_provider_id",
				table: "collection_metadata_id",
				column: "provider_id");

			migrationBuilder.CreateIndex(
				name: "ix_episode_metadata_id_provider_id",
				table: "episode_metadata_id",
				column: "provider_id");

			migrationBuilder.CreateIndex(
				name: "ix_link_library_provider_provider_id",
				table: "link_library_provider",
				column: "provider_id");

			migrationBuilder.CreateIndex(
				name: "ix_people_metadata_id_provider_id",
				table: "people_metadata_id",
				column: "provider_id");

			migrationBuilder.CreateIndex(
				name: "ix_providers_slug",
				table: "providers",
				column: "slug",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "ix_season_metadata_id_provider_id",
				table: "season_metadata_id",
				column: "provider_id");

			migrationBuilder.CreateIndex(
				name: "ix_show_metadata_id_provider_id",
				table: "show_metadata_id",
				column: "provider_id");

			migrationBuilder.CreateIndex(
				name: "ix_studio_metadata_id_provider_id",
				table: "studio_metadata_id",
				column: "provider_id");

			MigrationHelper.CreateLibraryItemsView(migrationBuilder);
		}
	}
}
