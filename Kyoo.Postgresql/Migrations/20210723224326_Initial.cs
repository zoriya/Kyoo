using System;
using System.Collections.Generic;
using Kyoo.Models;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace Kyoo.Postgresql.Migrations
{
    public partial class Initial : Migration
    {
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
                    poster = table.Column<string>(type: "text", nullable: true),
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
                    poster = table.Column<string>(type: "text", nullable: true)
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
                    logo = table.Column<string>(type: "text", nullable: true),
                    logo_extension = table.Column<string>(type: "text", nullable: true)
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
                    extra_data = table.Column<Dictionary<string, string>>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "link_library_collection",
                columns: table => new
                {
                    first_id = table.Column<int>(type: "integer", nullable: false),
                    second_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_link_library_collection", x => new { x.first_id, x.second_id });
                    table.ForeignKey(
                        name: "fk_link_library_collection_collections_second_id",
                        column: x => x.second_id,
                        principalTable: "collections",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_link_library_collection_libraries_first_id",
                        column: x => x.first_id,
                        principalTable: "libraries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "link_library_provider",
                columns: table => new
                {
                    first_id = table.Column<int>(type: "integer", nullable: false),
                    second_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_link_library_provider", x => new { x.first_id, x.second_id });
                    table.ForeignKey(
                        name: "fk_link_library_provider_libraries_first_id",
                        column: x => x.first_id,
                        principalTable: "libraries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_link_library_provider_providers_second_id",
                        column: x => x.second_id,
                        principalTable: "providers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "metadata_id_people",
                columns: table => new
                {
                    first_id = table.Column<int>(type: "integer", nullable: false),
                    second_id = table.Column<int>(type: "integer", nullable: false),
                    data_id = table.Column<string>(type: "text", nullable: true),
                    link = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_metadata_id_people", x => new { x.first_id, x.second_id });
                    table.ForeignKey(
                        name: "fk_metadata_id_people_people_first_id",
                        column: x => x.first_id,
                        principalTable: "people",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_metadata_id_people_providers_second_id",
                        column: x => x.second_id,
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
                    trailer_url = table.Column<string>(type: "text", nullable: true),
                    start_air = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    end_air = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    poster = table.Column<string>(type: "text", nullable: true),
                    logo = table.Column<string>(type: "text", nullable: true),
                    backdrop = table.Column<string>(type: "text", nullable: true),
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
                name: "link_collection_show",
                columns: table => new
                {
                    first_id = table.Column<int>(type: "integer", nullable: false),
                    second_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_link_collection_show", x => new { x.first_id, x.second_id });
                    table.ForeignKey(
                        name: "fk_link_collection_show_collections_first_id",
                        column: x => x.first_id,
                        principalTable: "collections",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_link_collection_show_shows_second_id",
                        column: x => x.second_id,
                        principalTable: "shows",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "link_library_show",
                columns: table => new
                {
                    first_id = table.Column<int>(type: "integer", nullable: false),
                    second_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_link_library_show", x => new { x.first_id, x.second_id });
                    table.ForeignKey(
                        name: "fk_link_library_show_libraries_first_id",
                        column: x => x.first_id,
                        principalTable: "libraries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_link_library_show_shows_second_id",
                        column: x => x.second_id,
                        principalTable: "shows",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "link_show_genre",
                columns: table => new
                {
                    first_id = table.Column<int>(type: "integer", nullable: false),
                    second_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_link_show_genre", x => new { x.first_id, x.second_id });
                    table.ForeignKey(
                        name: "fk_link_show_genre_genres_second_id",
                        column: x => x.second_id,
                        principalTable: "genres",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_link_show_genre_shows_first_id",
                        column: x => x.first_id,
                        principalTable: "shows",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "link_user_show",
                columns: table => new
                {
                    first_id = table.Column<int>(type: "integer", nullable: false),
                    second_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_link_user_show", x => new { x.first_id, x.second_id });
                    table.ForeignKey(
                        name: "fk_link_user_show_shows_second_id",
                        column: x => x.second_id,
                        principalTable: "shows",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_link_user_show_users_first_id",
                        column: x => x.first_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "metadata_id_show",
                columns: table => new
                {
                    first_id = table.Column<int>(type: "integer", nullable: false),
                    second_id = table.Column<int>(type: "integer", nullable: false),
                    data_id = table.Column<string>(type: "text", nullable: true),
                    link = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_metadata_id_show", x => new { x.first_id, x.second_id });
                    table.ForeignKey(
                        name: "fk_metadata_id_show_providers_second_id",
                        column: x => x.second_id,
                        principalTable: "providers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_metadata_id_show_shows_first_id",
                        column: x => x.first_id,
                        principalTable: "shows",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "people_roles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    for_people = table.Column<bool>(type: "boolean", nullable: false),
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
                    poster = table.Column<string>(type: "text", nullable: true)
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
                    thumb = table.Column<string>(type: "text", nullable: true),
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
                name: "metadata_id_season",
                columns: table => new
                {
                    first_id = table.Column<int>(type: "integer", nullable: false),
                    second_id = table.Column<int>(type: "integer", nullable: false),
                    data_id = table.Column<string>(type: "text", nullable: true),
                    link = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_metadata_id_season", x => new { x.first_id, x.second_id });
                    table.ForeignKey(
                        name: "fk_metadata_id_season_providers_second_id",
                        column: x => x.second_id,
                        principalTable: "providers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_metadata_id_season_seasons_first_id",
                        column: x => x.first_id,
                        principalTable: "seasons",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "metadata_id_episode",
                columns: table => new
                {
                    first_id = table.Column<int>(type: "integer", nullable: false),
                    second_id = table.Column<int>(type: "integer", nullable: false),
                    data_id = table.Column<string>(type: "text", nullable: true),
                    link = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_metadata_id_episode", x => new { x.first_id, x.second_id });
                    table.ForeignKey(
                        name: "fk_metadata_id_episode_episodes_first_id",
                        column: x => x.first_id,
                        principalTable: "episodes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_metadata_id_episode_providers_second_id",
                        column: x => x.second_id,
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
                    type = table.Column<StreamType>(type: "stream_type", nullable: false),
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
                    first_id = table.Column<int>(type: "integer", nullable: false),
                    second_id = table.Column<int>(type: "integer", nullable: false),
                    watched_percentage = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_watched_episodes", x => new { x.first_id, x.second_id });
                    table.ForeignKey(
                        name: "fk_watched_episodes_episodes_second_id",
                        column: x => x.second_id,
                        principalTable: "episodes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_watched_episodes_users_first_id",
                        column: x => x.first_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_collections_slug",
                table: "collections",
                column: "slug",
                unique: true);

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
                name: "ix_link_collection_show_second_id",
                table: "link_collection_show",
                column: "second_id");

            migrationBuilder.CreateIndex(
                name: "ix_link_library_collection_second_id",
                table: "link_library_collection",
                column: "second_id");

            migrationBuilder.CreateIndex(
                name: "ix_link_library_provider_second_id",
                table: "link_library_provider",
                column: "second_id");

            migrationBuilder.CreateIndex(
                name: "ix_link_library_show_second_id",
                table: "link_library_show",
                column: "second_id");

            migrationBuilder.CreateIndex(
                name: "ix_link_show_genre_second_id",
                table: "link_show_genre",
                column: "second_id");

            migrationBuilder.CreateIndex(
                name: "ix_link_user_show_second_id",
                table: "link_user_show",
                column: "second_id");

            migrationBuilder.CreateIndex(
                name: "ix_metadata_id_episode_second_id",
                table: "metadata_id_episode",
                column: "second_id");

            migrationBuilder.CreateIndex(
                name: "ix_metadata_id_people_second_id",
                table: "metadata_id_people",
                column: "second_id");

            migrationBuilder.CreateIndex(
                name: "ix_metadata_id_season_second_id",
                table: "metadata_id_season",
                column: "second_id");

            migrationBuilder.CreateIndex(
                name: "ix_metadata_id_show_second_id",
                table: "metadata_id_show",
                column: "second_id");

            migrationBuilder.CreateIndex(
                name: "ix_people_slug",
                table: "people",
                column: "slug",
                unique: true);

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
                name: "ix_shows_slug",
                table: "shows",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_shows_studio_id",
                table: "shows",
                column: "studio_id");

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
                name: "ix_watched_episodes_second_id",
                table: "watched_episodes",
                column: "second_id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
                name: "metadata_id_episode");

            migrationBuilder.DropTable(
                name: "metadata_id_people");

            migrationBuilder.DropTable(
                name: "metadata_id_season");

            migrationBuilder.DropTable(
                name: "metadata_id_show");

            migrationBuilder.DropTable(
                name: "people_roles");

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
                name: "providers");

            migrationBuilder.DropTable(
                name: "people");

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
