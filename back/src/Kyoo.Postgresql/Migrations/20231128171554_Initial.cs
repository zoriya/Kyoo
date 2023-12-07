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
using Kyoo.Abstractions.Models;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kyoo.Postgresql.Migrations
{
	/// <inheritdoc />
	public partial class Initial : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder
				.AlterDatabase()
				.Annotation(
					"Npgsql:Enum:genre",
					"action,adventure,animation,comedy,crime,documentary,drama,family,fantasy,history,horror,music,mystery,romance,science_fiction,thriller,war,western"
				)
				.Annotation("Npgsql:Enum:status", "unknown,finished,airing,planned");

			migrationBuilder.CreateTable(
				name: "collections",
				columns: table =>
					new
					{
						id = table.Column<Guid>(type: "uuid", nullable: false),
						slug = table.Column<string>(
							type: "character varying(256)",
							maxLength: 256,
							nullable: false
						),
						name = table.Column<string>(type: "text", nullable: false),
						overview = table.Column<string>(type: "text", nullable: true),
						added_date = table.Column<DateTime>(
							type: "timestamp with time zone",
							nullable: false,
							defaultValueSql: "now() at time zone 'utc'"
						),
						poster_source = table.Column<string>(type: "text", nullable: true),
						poster_blurhash = table.Column<string>(
							type: "character varying(32)",
							maxLength: 32,
							nullable: true
						),
						thumbnail_source = table.Column<string>(type: "text", nullable: true),
						thumbnail_blurhash = table.Column<string>(
							type: "character varying(32)",
							maxLength: 32,
							nullable: true
						),
						logo_source = table.Column<string>(type: "text", nullable: true),
						logo_blurhash = table.Column<string>(
							type: "character varying(32)",
							maxLength: 32,
							nullable: true
						),
						external_id = table.Column<string>(type: "json", nullable: false)
					},
				constraints: table =>
				{
					table.PrimaryKey("pk_collections", x => x.id);
				}
			);

			migrationBuilder.CreateTable(
				name: "studios",
				columns: table =>
					new
					{
						id = table.Column<Guid>(type: "uuid", nullable: false),
						slug = table.Column<string>(
							type: "character varying(256)",
							maxLength: 256,
							nullable: false
						),
						name = table.Column<string>(type: "text", nullable: false),
						external_id = table.Column<string>(type: "json", nullable: false)
					},
				constraints: table =>
				{
					table.PrimaryKey("pk_studios", x => x.id);
				}
			);

			migrationBuilder.CreateTable(
				name: "users",
				columns: table =>
					new
					{
						id = table.Column<Guid>(type: "uuid", nullable: false),
						slug = table.Column<string>(
							type: "character varying(256)",
							maxLength: 256,
							nullable: false
						),
						username = table.Column<string>(type: "text", nullable: false),
						email = table.Column<string>(type: "text", nullable: false),
						password = table.Column<string>(type: "text", nullable: false),
						permissions = table.Column<string[]>(type: "text[]", nullable: false),
						added_date = table.Column<DateTime>(
							type: "timestamp with time zone",
							nullable: false,
							defaultValueSql: "now() at time zone 'utc'"
						),
						logo_source = table.Column<string>(type: "text", nullable: true),
						logo_blurhash = table.Column<string>(
							type: "character varying(32)",
							maxLength: 32,
							nullable: true
						)
					},
				constraints: table =>
				{
					table.PrimaryKey("pk_users", x => x.id);
				}
			);

			migrationBuilder.CreateTable(
				name: "movies",
				columns: table =>
					new
					{
						id = table.Column<Guid>(type: "uuid", nullable: false),
						slug = table.Column<string>(
							type: "character varying(256)",
							maxLength: 256,
							nullable: false
						),
						name = table.Column<string>(type: "text", nullable: false),
						tagline = table.Column<string>(type: "text", nullable: true),
						aliases = table.Column<string[]>(type: "text[]", nullable: false),
						path = table.Column<string>(type: "text", nullable: false),
						overview = table.Column<string>(type: "text", nullable: true),
						tags = table.Column<string[]>(type: "text[]", nullable: false),
						genres = table.Column<Genre[]>(type: "genre[]", nullable: false),
						status = table.Column<Status>(type: "status", nullable: false),
						rating = table.Column<int>(type: "integer", nullable: false),
						runtime = table.Column<int>(type: "integer", nullable: false),
						air_date = table.Column<DateTime>(
							type: "timestamp with time zone",
							nullable: true
						),
						added_date = table.Column<DateTime>(
							type: "timestamp with time zone",
							nullable: false,
							defaultValueSql: "now() at time zone 'utc'"
						),
						poster_source = table.Column<string>(type: "text", nullable: true),
						poster_blurhash = table.Column<string>(
							type: "character varying(32)",
							maxLength: 32,
							nullable: true
						),
						thumbnail_source = table.Column<string>(type: "text", nullable: true),
						thumbnail_blurhash = table.Column<string>(
							type: "character varying(32)",
							maxLength: 32,
							nullable: true
						),
						logo_source = table.Column<string>(type: "text", nullable: true),
						logo_blurhash = table.Column<string>(
							type: "character varying(32)",
							maxLength: 32,
							nullable: true
						),
						trailer = table.Column<string>(type: "text", nullable: true),
						external_id = table.Column<string>(type: "json", nullable: false),
						studio_id = table.Column<Guid>(type: "uuid", nullable: true)
					},
				constraints: table =>
				{
					table.PrimaryKey("pk_movies", x => x.id);
					table.ForeignKey(
						name: "fk_movies_studios_studio_id",
						column: x => x.studio_id,
						principalTable: "studios",
						principalColumn: "id",
						onDelete: ReferentialAction.SetNull
					);
				}
			);

			migrationBuilder.CreateTable(
				name: "shows",
				columns: table =>
					new
					{
						id = table.Column<Guid>(type: "uuid", nullable: false),
						slug = table.Column<string>(
							type: "character varying(256)",
							maxLength: 256,
							nullable: false
						),
						name = table.Column<string>(type: "text", nullable: false),
						tagline = table.Column<string>(type: "text", nullable: true),
						aliases = table.Column<List<string>>(type: "text[]", nullable: false),
						overview = table.Column<string>(type: "text", nullable: true),
						tags = table.Column<List<string>>(type: "text[]", nullable: false),
						genres = table.Column<List<Genre>>(type: "genre[]", nullable: false),
						status = table.Column<Status>(type: "status", nullable: false),
						rating = table.Column<int>(type: "integer", nullable: false),
						start_air = table.Column<DateTime>(
							type: "timestamp with time zone",
							nullable: true
						),
						end_air = table.Column<DateTime>(
							type: "timestamp with time zone",
							nullable: true
						),
						added_date = table.Column<DateTime>(
							type: "timestamp with time zone",
							nullable: false,
							defaultValueSql: "now() at time zone 'utc'"
						),
						poster_source = table.Column<string>(type: "text", nullable: true),
						poster_blurhash = table.Column<string>(
							type: "character varying(32)",
							maxLength: 32,
							nullable: true
						),
						thumbnail_source = table.Column<string>(type: "text", nullable: true),
						thumbnail_blurhash = table.Column<string>(
							type: "character varying(32)",
							maxLength: 32,
							nullable: true
						),
						logo_source = table.Column<string>(type: "text", nullable: true),
						logo_blurhash = table.Column<string>(
							type: "character varying(32)",
							maxLength: 32,
							nullable: true
						),
						trailer = table.Column<string>(type: "text", nullable: true),
						external_id = table.Column<string>(type: "json", nullable: false),
						studio_id = table.Column<Guid>(type: "uuid", nullable: true)
					},
				constraints: table =>
				{
					table.PrimaryKey("pk_shows", x => x.id);
					table.ForeignKey(
						name: "fk_shows_studios_studio_id",
						column: x => x.studio_id,
						principalTable: "studios",
						principalColumn: "id",
						onDelete: ReferentialAction.SetNull
					);
				}
			);

			migrationBuilder.CreateTable(
				name: "link_collection_movie",
				columns: table =>
					new
					{
						collection_id = table.Column<Guid>(type: "uuid", nullable: false),
						movie_id = table.Column<Guid>(type: "uuid", nullable: false)
					},
				constraints: table =>
				{
					table.PrimaryKey(
						"pk_link_collection_movie",
						x => new { x.collection_id, x.movie_id }
					);
					table.ForeignKey(
						name: "fk_link_collection_movie_collections_collection_id",
						column: x => x.collection_id,
						principalTable: "collections",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade
					);
					table.ForeignKey(
						name: "fk_link_collection_movie_movies_movie_id",
						column: x => x.movie_id,
						principalTable: "movies",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade
					);
				}
			);

			migrationBuilder.CreateTable(
				name: "link_collection_show",
				columns: table =>
					new
					{
						collection_id = table.Column<Guid>(type: "uuid", nullable: false),
						show_id = table.Column<Guid>(type: "uuid", nullable: false)
					},
				constraints: table =>
				{
					table.PrimaryKey(
						"pk_link_collection_show",
						x => new { x.collection_id, x.show_id }
					);
					table.ForeignKey(
						name: "fk_link_collection_show_collections_collection_id",
						column: x => x.collection_id,
						principalTable: "collections",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade
					);
					table.ForeignKey(
						name: "fk_link_collection_show_shows_show_id",
						column: x => x.show_id,
						principalTable: "shows",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade
					);
				}
			);

			migrationBuilder.CreateTable(
				name: "seasons",
				columns: table =>
					new
					{
						id = table.Column<Guid>(type: "uuid", nullable: false),
						slug = table.Column<string>(
							type: "character varying(256)",
							maxLength: 256,
							nullable: false
						),
						show_id = table.Column<Guid>(type: "uuid", nullable: false),
						season_number = table.Column<int>(type: "integer", nullable: false),
						name = table.Column<string>(type: "text", nullable: true),
						overview = table.Column<string>(type: "text", nullable: true),
						start_date = table.Column<DateTime>(
							type: "timestamp with time zone",
							nullable: true
						),
						added_date = table.Column<DateTime>(
							type: "timestamp with time zone",
							nullable: false,
							defaultValueSql: "now() at time zone 'utc'"
						),
						end_date = table.Column<DateTime>(
							type: "timestamp with time zone",
							nullable: true
						),
						poster_source = table.Column<string>(type: "text", nullable: true),
						poster_blurhash = table.Column<string>(
							type: "character varying(32)",
							maxLength: 32,
							nullable: true
						),
						thumbnail_source = table.Column<string>(type: "text", nullable: true),
						thumbnail_blurhash = table.Column<string>(
							type: "character varying(32)",
							maxLength: 32,
							nullable: true
						),
						logo_source = table.Column<string>(type: "text", nullable: true),
						logo_blurhash = table.Column<string>(
							type: "character varying(32)",
							maxLength: 32,
							nullable: true
						),
						external_id = table.Column<string>(type: "json", nullable: false)
					},
				constraints: table =>
				{
					table.PrimaryKey("pk_seasons", x => x.id);
					table.ForeignKey(
						name: "fk_seasons_shows_show_id",
						column: x => x.show_id,
						principalTable: "shows",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade
					);
				}
			);

			migrationBuilder.CreateTable(
				name: "episodes",
				columns: table =>
					new
					{
						id = table.Column<Guid>(type: "uuid", nullable: false),
						slug = table.Column<string>(
							type: "character varying(256)",
							maxLength: 256,
							nullable: false
						),
						show_id = table.Column<Guid>(type: "uuid", nullable: false),
						season_id = table.Column<Guid>(type: "uuid", nullable: true),
						season_number = table.Column<int>(type: "integer", nullable: true),
						episode_number = table.Column<int>(type: "integer", nullable: true),
						absolute_number = table.Column<int>(type: "integer", nullable: true),
						path = table.Column<string>(type: "text", nullable: false),
						name = table.Column<string>(type: "text", nullable: true),
						overview = table.Column<string>(type: "text", nullable: true),
						runtime = table.Column<int>(type: "integer", nullable: false),
						release_date = table.Column<DateTime>(
							type: "timestamp with time zone",
							nullable: true
						),
						added_date = table.Column<DateTime>(
							type: "timestamp with time zone",
							nullable: false,
							defaultValueSql: "now() at time zone 'utc'"
						),
						poster_source = table.Column<string>(type: "text", nullable: true),
						poster_blurhash = table.Column<string>(
							type: "character varying(32)",
							maxLength: 32,
							nullable: true
						),
						thumbnail_source = table.Column<string>(type: "text", nullable: true),
						thumbnail_blurhash = table.Column<string>(
							type: "character varying(32)",
							maxLength: 32,
							nullable: true
						),
						logo_source = table.Column<string>(type: "text", nullable: true),
						logo_blurhash = table.Column<string>(
							type: "character varying(32)",
							maxLength: 32,
							nullable: true
						),
						external_id = table.Column<string>(type: "json", nullable: false)
					},
				constraints: table =>
				{
					table.PrimaryKey("pk_episodes", x => x.id);
					table.ForeignKey(
						name: "fk_episodes_seasons_season_id",
						column: x => x.season_id,
						principalTable: "seasons",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade
					);
					table.ForeignKey(
						name: "fk_episodes_shows_show_id",
						column: x => x.show_id,
						principalTable: "shows",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade
					);
				}
			);

			migrationBuilder.CreateIndex(
				name: "ix_collections_slug",
				table: "collections",
				column: "slug",
				unique: true
			);

			migrationBuilder.CreateIndex(
				name: "ix_episodes_season_id",
				table: "episodes",
				column: "season_id"
			);

			migrationBuilder.CreateIndex(
				name: "ix_episodes_show_id_season_number_episode_number_absolute_numb",
				table: "episodes",
				columns: new[] { "show_id", "season_number", "episode_number", "absolute_number" },
				unique: true
			);

			migrationBuilder.CreateIndex(
				name: "ix_episodes_slug",
				table: "episodes",
				column: "slug",
				unique: true
			);

			migrationBuilder.CreateIndex(
				name: "ix_link_collection_movie_movie_id",
				table: "link_collection_movie",
				column: "movie_id"
			);

			migrationBuilder.CreateIndex(
				name: "ix_link_collection_show_show_id",
				table: "link_collection_show",
				column: "show_id"
			);

			migrationBuilder.CreateIndex(
				name: "ix_movies_slug",
				table: "movies",
				column: "slug",
				unique: true
			);

			migrationBuilder.CreateIndex(
				name: "ix_movies_studio_id",
				table: "movies",
				column: "studio_id"
			);

			migrationBuilder.CreateIndex(
				name: "ix_seasons_show_id_season_number",
				table: "seasons",
				columns: new[] { "show_id", "season_number" },
				unique: true
			);

			migrationBuilder.CreateIndex(
				name: "ix_seasons_slug",
				table: "seasons",
				column: "slug",
				unique: true
			);

			migrationBuilder.CreateIndex(
				name: "ix_shows_slug",
				table: "shows",
				column: "slug",
				unique: true
			);

			migrationBuilder.CreateIndex(
				name: "ix_shows_studio_id",
				table: "shows",
				column: "studio_id"
			);

			migrationBuilder.CreateIndex(
				name: "ix_studios_slug",
				table: "studios",
				column: "slug",
				unique: true
			);

			migrationBuilder.CreateIndex(
				name: "ix_users_slug",
				table: "users",
				column: "slug",
				unique: true
			);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(name: "episodes");

			migrationBuilder.DropTable(name: "link_collection_movie");

			migrationBuilder.DropTable(name: "link_collection_show");

			migrationBuilder.DropTable(name: "users");

			migrationBuilder.DropTable(name: "seasons");

			migrationBuilder.DropTable(name: "movies");

			migrationBuilder.DropTable(name: "collections");

			migrationBuilder.DropTable(name: "shows");

			migrationBuilder.DropTable(name: "studios");
		}
	}
}
