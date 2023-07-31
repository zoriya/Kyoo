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
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace Kyoo.Postgresql.Migrations
{
	/// <summary>
	/// The initial migration that build most of the database.
	/// </summary>
	[DbContext(typeof(PostgresContext))]
	[Migration("20210801171613_Initial")]
	public partial class Initial : Migration
	{
		/// <inheritdoc/>
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterDatabase()
				.Annotation("Npgsql:Enum:item_type", "show,movie,collection")
				.Annotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
				.Annotation("Npgsql:Enum:stream_type", "unknown,video,audio,subtitle,attachment");

			migrationBuilder.CreateTable(
				name: "collections",
				columns: table => new
				{
					id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					slug = table.Column<string>(type: "text", nullable: false),
					name = table.Column<string>(type: "text", nullable: true),
					images = table.Column<Dictionary<int, string>>(type: "jsonb", nullable: true),
					overview = table.Column<string>(type: "text", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_collections", x => x.id);
				});

			migrationBuilder.CreateTable(
				name: "genres",
				columns: table => new
				{
					id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					slug = table.Column<string>(type: "text", nullable: false),
					name = table.Column<string>(type: "text", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_genres", x => x.id);
				});

			migrationBuilder.CreateTable(
				name: "libraries",
				columns: table => new
				{
					id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					slug = table.Column<string>(type: "text", nullable: false),
					name = table.Column<string>(type: "text", nullable: true),
					paths = table.Column<string[]>(type: "text[]", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_libraries", x => x.id);
				});

			migrationBuilder.CreateTable(
				name: "people",
				columns: table => new
				{
					id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					slug = table.Column<string>(type: "text", nullable: false),
					name = table.Column<string>(type: "text", nullable: true),
					images = table.Column<Dictionary<int, string>>(type: "jsonb", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_people", x => x.id);
				});

			migrationBuilder.CreateTable(
				name: "providers",
				columns: table => new
				{
					id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					slug = table.Column<string>(type: "text", nullable: false),
					name = table.Column<string>(type: "text", nullable: true),
					images = table.Column<Dictionary<int, string>>(type: "jsonb", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_providers", x => x.id);
				});

			migrationBuilder.CreateTable(
				name: "studios",
				columns: table => new
				{
					id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					slug = table.Column<string>(type: "text", nullable: false),
					name = table.Column<string>(type: "text", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_studios", x => x.id);
				});

			migrationBuilder.CreateTable(
				name: "users",
				columns: table => new
				{
					id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					slug = table.Column<string>(type: "text", nullable: false),
					username = table.Column<string>(type: "text", nullable: true),
					email = table.Column<string>(type: "text", nullable: true),
					password = table.Column<string>(type: "text", nullable: true),
					permissions = table.Column<string[]>(type: "text[]", nullable: true),
					extra_data = table.Column<Dictionary<string, string>>(type: "jsonb", nullable: true),
					images = table.Column<Dictionary<int, string>>(type: "jsonb", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_users", x => x.id);
				});

			migrationBuilder.CreateTable(
				name: "link_library_collection",
				columns: table => new
				{
					collection_id = table.Column<int>(type: "integer", nullable: false),
					library_id = table.Column<int>(type: "integer", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_link_library_collection", x => new { x.collection_id, x.library_id });
					table.ForeignKey(
						name: "fk_link_library_collection_collections_collection_id",
						column: x => x.collection_id,
						principalTable: "collections",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_link_library_collection_libraries_library_id",
						column: x => x.library_id,
						principalTable: "libraries",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
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
				name: "shows",
				columns: table => new
				{
					id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					slug = table.Column<string>(type: "text", nullable: false),
					title = table.Column<string>(type: "text", nullable: true),
					aliases = table.Column<string[]>(type: "text[]", nullable: true),
					path = table.Column<string>(type: "text", nullable: true),
					overview = table.Column<string>(type: "text", nullable: true),
					status = table.Column<Status>(type: "status", nullable: false),
					start_air = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
					end_air = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
					images = table.Column<Dictionary<int, string>>(type: "jsonb", nullable: true),
					is_movie = table.Column<bool>(type: "boolean", nullable: false),
					studio_id = table.Column<int>(type: "integer", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_shows", x => x.id);
					table.ForeignKey(
						name: "fk_shows_studios_studio_id",
						column: x => x.studio_id,
						principalTable: "studios",
						principalColumn: "id",
						onDelete: ReferentialAction.SetNull);
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

			migrationBuilder.CreateTable(
				name: "link_collection_show",
				columns: table => new
				{
					collection_id = table.Column<int>(type: "integer", nullable: false),
					show_id = table.Column<int>(type: "integer", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_link_collection_show", x => new { x.collection_id, x.show_id });
					table.ForeignKey(
						name: "fk_link_collection_show_collections_collection_id",
						column: x => x.collection_id,
						principalTable: "collections",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_link_collection_show_shows_show_id",
						column: x => x.show_id,
						principalTable: "shows",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "link_library_show",
				columns: table => new
				{
					library_id = table.Column<int>(type: "integer", nullable: false),
					show_id = table.Column<int>(type: "integer", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_link_library_show", x => new { x.library_id, x.show_id });
					table.ForeignKey(
						name: "fk_link_library_show_libraries_library_id",
						column: x => x.library_id,
						principalTable: "libraries",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_link_library_show_shows_show_id",
						column: x => x.show_id,
						principalTable: "shows",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "link_show_genre",
				columns: table => new
				{
					genre_id = table.Column<int>(type: "integer", nullable: false),
					show_id = table.Column<int>(type: "integer", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_link_show_genre", x => new { x.genre_id, x.show_id });
					table.ForeignKey(
						name: "fk_link_show_genre_genres_genre_id",
						column: x => x.genre_id,
						principalTable: "genres",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_link_show_genre_shows_show_id",
						column: x => x.show_id,
						principalTable: "shows",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "link_user_show",
				columns: table => new
				{
					users_id = table.Column<int>(type: "integer", nullable: false),
					watched_id = table.Column<int>(type: "integer", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_link_user_show", x => new { x.users_id, x.watched_id });
					table.ForeignKey(
						name: "fk_link_user_show_shows_watched_id",
						column: x => x.watched_id,
						principalTable: "shows",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_link_user_show_users_users_id",
						column: x => x.users_id,
						principalTable: "users",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "people_roles",
				columns: table => new
				{
					id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					people_id = table.Column<int>(type: "integer", nullable: false),
					show_id = table.Column<int>(type: "integer", nullable: false),
					type = table.Column<string>(type: "text", nullable: true),
					role = table.Column<string>(type: "text", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_people_roles", x => x.id);
					table.ForeignKey(
						name: "fk_people_roles_people_people_id",
						column: x => x.people_id,
						principalTable: "people",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_people_roles_shows_show_id",
						column: x => x.show_id,
						principalTable: "shows",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "seasons",
				columns: table => new
				{
					id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					slug = table.Column<string>(type: "text", nullable: true),
					show_id = table.Column<int>(type: "integer", nullable: false),
					season_number = table.Column<int>(type: "integer", nullable: false),
					title = table.Column<string>(type: "text", nullable: true),
					overview = table.Column<string>(type: "text", nullable: true),
					start_date = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
					end_date = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
					images = table.Column<Dictionary<int, string>>(type: "jsonb", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_seasons", x => x.id);
					table.ForeignKey(
						name: "fk_seasons_shows_show_id",
						column: x => x.show_id,
						principalTable: "shows",
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
				name: "episodes",
				columns: table => new
				{
					id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					slug = table.Column<string>(type: "text", nullable: true),
					show_id = table.Column<int>(type: "integer", nullable: false),
					season_id = table.Column<int>(type: "integer", nullable: true),
					season_number = table.Column<int>(type: "integer", nullable: true),
					episode_number = table.Column<int>(type: "integer", nullable: true),
					absolute_number = table.Column<int>(type: "integer", nullable: true),
					path = table.Column<string>(type: "text", nullable: true),
					images = table.Column<Dictionary<int, string>>(type: "jsonb", nullable: true),
					title = table.Column<string>(type: "text", nullable: true),
					overview = table.Column<string>(type: "text", nullable: true),
					release_date = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_episodes", x => x.id);
					table.ForeignKey(
						name: "fk_episodes_seasons_season_id",
						column: x => x.season_id,
						principalTable: "seasons",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_episodes_shows_show_id",
						column: x => x.show_id,
						principalTable: "shows",
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
				name: "tracks",
				columns: table => new
				{
					id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					slug = table.Column<string>(type: "text", nullable: true),
					title = table.Column<string>(type: "text", nullable: true),
					language = table.Column<string>(type: "text", nullable: true),
					codec = table.Column<string>(type: "text", nullable: true),
					is_default = table.Column<bool>(type: "boolean", nullable: false),
					is_forced = table.Column<bool>(type: "boolean", nullable: false),
					is_external = table.Column<bool>(type: "boolean", nullable: false),
					path = table.Column<string>(type: "text", nullable: true),
					type = table.Column<object>(type: "stream_type", nullable: false),
					episode_id = table.Column<int>(type: "integer", nullable: false),
					track_index = table.Column<int>(type: "integer", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_tracks", x => x.id);
					table.ForeignKey(
						name: "fk_tracks_episodes_episode_id",
						column: x => x.episode_id,
						principalTable: "episodes",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "watched_episodes",
				columns: table => new
				{
					user_id = table.Column<int>(type: "integer", nullable: false),
					episode_id = table.Column<int>(type: "integer", nullable: false),
					watched_percentage = table.Column<int>(type: "integer", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_watched_episodes", x => new { x.user_id, x.episode_id });
					table.ForeignKey(
						name: "fk_watched_episodes_episodes_episode_id",
						column: x => x.episode_id,
						principalTable: "episodes",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_watched_episodes_users_user_id",
						column: x => x.user_id,
						principalTable: "users",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateIndex(
				name: "ix_collection_metadata_id_provider_id",
				table: "collection_metadata_id",
				column: "provider_id");

			migrationBuilder.CreateIndex(
				name: "ix_collections_slug",
				table: "collections",
				column: "slug",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "ix_episode_metadata_id_provider_id",
				table: "episode_metadata_id",
				column: "provider_id");

			migrationBuilder.CreateIndex(
				name: "ix_episodes_season_id",
				table: "episodes",
				column: "season_id");

			migrationBuilder.CreateIndex(
				name: "ix_episodes_show_id_season_number_episode_number_absolute_numb",
				table: "episodes",
				columns: new[] { "show_id", "season_number", "episode_number", "absolute_number" },
				unique: true);

			migrationBuilder.CreateIndex(
				name: "ix_episodes_slug",
				table: "episodes",
				column: "slug",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "ix_genres_slug",
				table: "genres",
				column: "slug",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "ix_libraries_slug",
				table: "libraries",
				column: "slug",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "ix_link_collection_show_show_id",
				table: "link_collection_show",
				column: "show_id");

			migrationBuilder.CreateIndex(
				name: "ix_link_library_collection_library_id",
				table: "link_library_collection",
				column: "library_id");

			migrationBuilder.CreateIndex(
				name: "ix_link_library_provider_provider_id",
				table: "link_library_provider",
				column: "provider_id");

			migrationBuilder.CreateIndex(
				name: "ix_link_library_show_show_id",
				table: "link_library_show",
				column: "show_id");

			migrationBuilder.CreateIndex(
				name: "ix_link_show_genre_show_id",
				table: "link_show_genre",
				column: "show_id");

			migrationBuilder.CreateIndex(
				name: "ix_link_user_show_watched_id",
				table: "link_user_show",
				column: "watched_id");

			migrationBuilder.CreateIndex(
				name: "ix_people_slug",
				table: "people",
				column: "slug",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "ix_people_metadata_id_provider_id",
				table: "people_metadata_id",
				column: "provider_id");

			migrationBuilder.CreateIndex(
				name: "ix_people_roles_people_id",
				table: "people_roles",
				column: "people_id");

			migrationBuilder.CreateIndex(
				name: "ix_people_roles_show_id",
				table: "people_roles",
				column: "show_id");

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
				name: "ix_seasons_show_id_season_number",
				table: "seasons",
				columns: new[] { "show_id", "season_number" },
				unique: true);

			migrationBuilder.CreateIndex(
				name: "ix_seasons_slug",
				table: "seasons",
				column: "slug",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "ix_show_metadata_id_provider_id",
				table: "show_metadata_id",
				column: "provider_id");

			migrationBuilder.CreateIndex(
				name: "ix_shows_slug",
				table: "shows",
				column: "slug",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "ix_shows_studio_id",
				table: "shows",
				column: "studio_id");

			migrationBuilder.CreateIndex(
				name: "ix_studio_metadata_id_provider_id",
				table: "studio_metadata_id",
				column: "provider_id");

			migrationBuilder.CreateIndex(
				name: "ix_studios_slug",
				table: "studios",
				column: "slug",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "ix_tracks_episode_id_type_language_track_index_is_forced",
				table: "tracks",
				columns: new[] { "episode_id", "type", "language", "track_index", "is_forced" },
				unique: true);

			migrationBuilder.CreateIndex(
				name: "ix_tracks_slug",
				table: "tracks",
				column: "slug",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "ix_users_slug",
				table: "users",
				column: "slug",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "ix_watched_episodes_episode_id",
				table: "watched_episodes",
				column: "episode_id");
		}

		/// <inheritdoc/>
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				name: "collection_metadata_id");

			migrationBuilder.DropTable(
				name: "episode_metadata_id");

			migrationBuilder.DropTable(
				name: "link_collection_show");

			migrationBuilder.DropTable(
				name: "link_library_collection");

			migrationBuilder.DropTable(
				name: "link_library_provider");

			migrationBuilder.DropTable(
				name: "link_library_show");

			migrationBuilder.DropTable(
				name: "link_show_genre");

			migrationBuilder.DropTable(
				name: "link_user_show");

			migrationBuilder.DropTable(
				name: "people_metadata_id");

			migrationBuilder.DropTable(
				name: "people_roles");

			migrationBuilder.DropTable(
				name: "season_metadata_id");

			migrationBuilder.DropTable(
				name: "show_metadata_id");

			migrationBuilder.DropTable(
				name: "studio_metadata_id");

			migrationBuilder.DropTable(
				name: "tracks");

			migrationBuilder.DropTable(
				name: "watched_episodes");

			migrationBuilder.DropTable(
				name: "collections");

			migrationBuilder.DropTable(
				name: "libraries");

			migrationBuilder.DropTable(
				name: "genres");

			migrationBuilder.DropTable(
				name: "people");

			migrationBuilder.DropTable(
				name: "providers");

			migrationBuilder.DropTable(
				name: "episodes");

			migrationBuilder.DropTable(
				name: "users");

			migrationBuilder.DropTable(
				name: "seasons");

			migrationBuilder.DropTable(
				name: "shows");

			migrationBuilder.DropTable(
				name: "studios");
		}
	}
}
