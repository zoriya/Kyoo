using System;
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
                .Annotation("Npgsql:Enum:status", "finished,airing,planned,unknown")
                .Annotation("Npgsql:Enum:stream_type", "unknown,video,audio,subtitle,attachment");

            migrationBuilder.CreateTable(
                name: "Collections",
                columns: table => new
                {
                    ID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: true),
                    Poster = table.Column<string>(type: "text", nullable: true),
                    Overview = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Collections", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Genres",
                columns: table => new
                {
                    ID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Genres", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Libraries",
                columns: table => new
                {
                    ID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: true),
                    Paths = table.Column<string[]>(type: "text[]", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Libraries", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "People",
                columns: table => new
                {
                    ID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: true),
                    Poster = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_People", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Providers",
                columns: table => new
                {
                    ID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: true),
                    Logo = table.Column<string>(type: "text", nullable: true),
                    LogoExtension = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Providers", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Studios",
                columns: table => new
                {
                    ID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Studios", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Link<Library, Collection>",
                columns: table => new
                {
                    FirstID = table.Column<int>(type: "integer", nullable: false),
                    SecondID = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Link<Library, Collection>", x => new { x.FirstID, x.SecondID });
                    table.ForeignKey(
                        name: "FK_Link<Library, Collection>_Collections_SecondID",
                        column: x => x.SecondID,
                        principalTable: "Collections",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Link<Library, Collection>_Libraries_FirstID",
                        column: x => x.FirstID,
                        principalTable: "Libraries",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Link<Library, Provider>",
                columns: table => new
                {
                    FirstID = table.Column<int>(type: "integer", nullable: false),
                    SecondID = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Link<Library, Provider>", x => new { x.FirstID, x.SecondID });
                    table.ForeignKey(
                        name: "FK_Link<Library, Provider>_Libraries_FirstID",
                        column: x => x.FirstID,
                        principalTable: "Libraries",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Link<Library, Provider>_Providers_SecondID",
                        column: x => x.SecondID,
                        principalTable: "Providers",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Shows",
                columns: table => new
                {
                    ID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: true),
                    Aliases = table.Column<string[]>(type: "text[]", nullable: true),
                    Path = table.Column<string>(type: "text", nullable: true),
                    Overview = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<Status>(type: "status", nullable: true),
                    TrailerUrl = table.Column<string>(type: "text", nullable: true),
                    StartYear = table.Column<int>(type: "integer", nullable: true),
                    EndYear = table.Column<int>(type: "integer", nullable: true),
                    Poster = table.Column<string>(type: "text", nullable: true),
                    Logo = table.Column<string>(type: "text", nullable: true),
                    Backdrop = table.Column<string>(type: "text", nullable: true),
                    IsMovie = table.Column<bool>(type: "boolean", nullable: false),
                    StudioID = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shows", x => x.ID);
                    table.ForeignKey(
                        name: "FK_Shows_Studios_StudioID",
                        column: x => x.StudioID,
                        principalTable: "Studios",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Link<Collection, Show>",
                columns: table => new
                {
                    FirstID = table.Column<int>(type: "integer", nullable: false),
                    SecondID = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Link<Collection, Show>", x => new { x.FirstID, x.SecondID });
                    table.ForeignKey(
                        name: "FK_Link<Collection, Show>_Collections_FirstID",
                        column: x => x.FirstID,
                        principalTable: "Collections",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Link<Collection, Show>_Shows_SecondID",
                        column: x => x.SecondID,
                        principalTable: "Shows",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Link<Library, Show>",
                columns: table => new
                {
                    FirstID = table.Column<int>(type: "integer", nullable: false),
                    SecondID = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Link<Library, Show>", x => new { x.FirstID, x.SecondID });
                    table.ForeignKey(
                        name: "FK_Link<Library, Show>_Libraries_FirstID",
                        column: x => x.FirstID,
                        principalTable: "Libraries",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Link<Library, Show>_Shows_SecondID",
                        column: x => x.SecondID,
                        principalTable: "Shows",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Link<Show, Genre>",
                columns: table => new
                {
                    FirstID = table.Column<int>(type: "integer", nullable: false),
                    SecondID = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Link<Show, Genre>", x => new { x.FirstID, x.SecondID });
                    table.ForeignKey(
                        name: "FK_Link<Show, Genre>_Genres_SecondID",
                        column: x => x.SecondID,
                        principalTable: "Genres",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Link<Show, Genre>_Shows_FirstID",
                        column: x => x.FirstID,
                        principalTable: "Shows",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PeopleRoles",
                columns: table => new
                {
                    ID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PeopleID = table.Column<int>(type: "integer", nullable: false),
                    ShowID = table.Column<int>(type: "integer", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PeopleRoles", x => x.ID);
                    table.ForeignKey(
                        name: "FK_PeopleRoles_People_PeopleID",
                        column: x => x.PeopleID,
                        principalTable: "People",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PeopleRoles_Shows_ShowID",
                        column: x => x.ShowID,
                        principalTable: "Shows",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Seasons",
                columns: table => new
                {
                    ID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ShowID = table.Column<int>(type: "integer", nullable: false),
                    SeasonNumber = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: true),
                    Overview = table.Column<string>(type: "text", nullable: true),
                    Year = table.Column<int>(type: "integer", nullable: true),
                    Poster = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Seasons", x => x.ID);
                    table.ForeignKey(
                        name: "FK_Seasons_Shows_ShowID",
                        column: x => x.ShowID,
                        principalTable: "Shows",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Episodes",
                columns: table => new
                {
                    ID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ShowID = table.Column<int>(type: "integer", nullable: false),
                    SeasonID = table.Column<int>(type: "integer", nullable: true),
                    SeasonNumber = table.Column<int>(type: "integer", nullable: false),
                    EpisodeNumber = table.Column<int>(type: "integer", nullable: false),
                    AbsoluteNumber = table.Column<int>(type: "integer", nullable: false),
                    Path = table.Column<string>(type: "text", nullable: true),
                    Thumb = table.Column<string>(type: "text", nullable: true),
                    Title = table.Column<string>(type: "text", nullable: true),
                    Overview = table.Column<string>(type: "text", nullable: true),
                    ReleaseDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Runtime = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Episodes", x => x.ID);
                    table.ForeignKey(
                        name: "FK_Episodes_Seasons_SeasonID",
                        column: x => x.SeasonID,
                        principalTable: "Seasons",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Episodes_Shows_ShowID",
                        column: x => x.ShowID,
                        principalTable: "Shows",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MetadataIds",
                columns: table => new
                {
                    ID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProviderID = table.Column<int>(type: "integer", nullable: false),
                    ShowID = table.Column<int>(type: "integer", nullable: true),
                    EpisodeID = table.Column<int>(type: "integer", nullable: true),
                    SeasonID = table.Column<int>(type: "integer", nullable: true),
                    PeopleID = table.Column<int>(type: "integer", nullable: true),
                    DataID = table.Column<string>(type: "text", nullable: true),
                    Link = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MetadataIds", x => x.ID);
                    table.ForeignKey(
                        name: "FK_MetadataIds_Episodes_EpisodeID",
                        column: x => x.EpisodeID,
                        principalTable: "Episodes",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MetadataIds_People_PeopleID",
                        column: x => x.PeopleID,
                        principalTable: "People",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MetadataIds_Providers_ProviderID",
                        column: x => x.ProviderID,
                        principalTable: "Providers",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MetadataIds_Seasons_SeasonID",
                        column: x => x.SeasonID,
                        principalTable: "Seasons",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MetadataIds_Shows_ShowID",
                        column: x => x.ShowID,
                        principalTable: "Shows",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tracks",
                columns: table => new
                {
                    ID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EpisodeID = table.Column<int>(type: "integer", nullable: false),
                    TrackIndex = table.Column<int>(type: "integer", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    IsForced = table.Column<bool>(type: "boolean", nullable: false),
                    IsExternal = table.Column<bool>(type: "boolean", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: true),
                    Language = table.Column<string>(type: "text", nullable: true),
                    Codec = table.Column<string>(type: "text", nullable: true),
                    Path = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<StreamType>(type: "stream_type", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tracks", x => x.ID);
                    table.ForeignKey(
                        name: "FK_Tracks_Episodes_EpisodeID",
                        column: x => x.EpisodeID,
                        principalTable: "Episodes",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Collections_Slug",
                table: "Collections",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Episodes_SeasonID",
                table: "Episodes",
                column: "SeasonID");

            migrationBuilder.CreateIndex(
                name: "IX_Episodes_ShowID_SeasonNumber_EpisodeNumber_AbsoluteNumber",
                table: "Episodes",
                columns: new[] { "ShowID", "SeasonNumber", "EpisodeNumber", "AbsoluteNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Genres_Slug",
                table: "Genres",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Libraries_Slug",
                table: "Libraries",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Link<Collection, Show>_SecondID",
                table: "Link<Collection, Show>",
                column: "SecondID");

            migrationBuilder.CreateIndex(
                name: "IX_Link<Library, Collection>_SecondID",
                table: "Link<Library, Collection>",
                column: "SecondID");

            migrationBuilder.CreateIndex(
                name: "IX_Link<Library, Provider>_SecondID",
                table: "Link<Library, Provider>",
                column: "SecondID");

            migrationBuilder.CreateIndex(
                name: "IX_Link<Library, Show>_SecondID",
                table: "Link<Library, Show>",
                column: "SecondID");

            migrationBuilder.CreateIndex(
                name: "IX_Link<Show, Genre>_SecondID",
                table: "Link<Show, Genre>",
                column: "SecondID");

            migrationBuilder.CreateIndex(
                name: "IX_MetadataIds_EpisodeID",
                table: "MetadataIds",
                column: "EpisodeID");

            migrationBuilder.CreateIndex(
                name: "IX_MetadataIds_PeopleID",
                table: "MetadataIds",
                column: "PeopleID");

            migrationBuilder.CreateIndex(
                name: "IX_MetadataIds_ProviderID",
                table: "MetadataIds",
                column: "ProviderID");

            migrationBuilder.CreateIndex(
                name: "IX_MetadataIds_SeasonID",
                table: "MetadataIds",
                column: "SeasonID");

            migrationBuilder.CreateIndex(
                name: "IX_MetadataIds_ShowID",
                table: "MetadataIds",
                column: "ShowID");

            migrationBuilder.CreateIndex(
                name: "IX_People_Slug",
                table: "People",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PeopleRoles_PeopleID",
                table: "PeopleRoles",
                column: "PeopleID");

            migrationBuilder.CreateIndex(
                name: "IX_PeopleRoles_ShowID",
                table: "PeopleRoles",
                column: "ShowID");

            migrationBuilder.CreateIndex(
                name: "IX_Providers_Slug",
                table: "Providers",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Seasons_ShowID_SeasonNumber",
                table: "Seasons",
                columns: new[] { "ShowID", "SeasonNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Shows_Slug",
                table: "Shows",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Shows_StudioID",
                table: "Shows",
                column: "StudioID");

            migrationBuilder.CreateIndex(
                name: "IX_Studios_Slug",
                table: "Studios",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tracks_EpisodeID_Type_Language_TrackIndex_IsForced",
                table: "Tracks",
                columns: new[] { "EpisodeID", "Type", "Language", "TrackIndex", "IsForced" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Link<Collection, Show>");

            migrationBuilder.DropTable(
                name: "Link<Library, Collection>");

            migrationBuilder.DropTable(
                name: "Link<Library, Provider>");

            migrationBuilder.DropTable(
                name: "Link<Library, Show>");

            migrationBuilder.DropTable(
                name: "Link<Show, Genre>");

            migrationBuilder.DropTable(
                name: "MetadataIds");

            migrationBuilder.DropTable(
                name: "PeopleRoles");

            migrationBuilder.DropTable(
                name: "Tracks");

            migrationBuilder.DropTable(
                name: "Collections");

            migrationBuilder.DropTable(
                name: "Libraries");

            migrationBuilder.DropTable(
                name: "Genres");

            migrationBuilder.DropTable(
                name: "Providers");

            migrationBuilder.DropTable(
                name: "People");

            migrationBuilder.DropTable(
                name: "Episodes");

            migrationBuilder.DropTable(
                name: "Seasons");

            migrationBuilder.DropTable(
                name: "Shows");

            migrationBuilder.DropTable(
                name: "Studios");
        }
    }
}
