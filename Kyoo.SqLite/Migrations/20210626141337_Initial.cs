using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Kyoo.SqLite.Migrations
{
    public partial class Initial : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Collections",
                columns: table => new
                {
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Slug = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: true),
                    Poster = table.Column<string>(type: "TEXT", nullable: true),
                    Overview = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Collections", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Genres",
                columns: table => new
                {
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Slug = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Genres", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Libraries",
                columns: table => new
                {
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Slug = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: true),
                    Paths = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Libraries", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "People",
                columns: table => new
                {
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Slug = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: true),
                    Poster = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_People", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Providers",
                columns: table => new
                {
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Slug = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: true),
                    Logo = table.Column<string>(type: "TEXT", nullable: true),
                    LogoExtension = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Providers", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Studios",
                columns: table => new
                {
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Slug = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Studios", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Slug = table.Column<string>(type: "TEXT", nullable: false),
                    Username = table.Column<string>(type: "TEXT", nullable: true),
                    Email = table.Column<string>(type: "TEXT", nullable: true),
                    Password = table.Column<string>(type: "TEXT", nullable: true),
                    Permissions = table.Column<string>(type: "TEXT", nullable: true),
                    ExtraData = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Link<Library, Collection>",
                columns: table => new
                {
                    FirstID = table.Column<int>(type: "INTEGER", nullable: false),
                    SecondID = table.Column<int>(type: "INTEGER", nullable: false)
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
                    FirstID = table.Column<int>(type: "INTEGER", nullable: false),
                    SecondID = table.Column<int>(type: "INTEGER", nullable: false)
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
                name: "MetadataID<People>",
                columns: table => new
                {
                    FirstID = table.Column<int>(type: "INTEGER", nullable: false),
                    SecondID = table.Column<int>(type: "INTEGER", nullable: false),
                    DataID = table.Column<string>(type: "TEXT", nullable: true),
                    Link = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MetadataID<People>", x => new { x.FirstID, x.SecondID });
                    table.ForeignKey(
                        name: "FK_MetadataID<People>_People_FirstID",
                        column: x => x.FirstID,
                        principalTable: "People",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MetadataID<People>_Providers_SecondID",
                        column: x => x.SecondID,
                        principalTable: "Providers",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Shows",
                columns: table => new
                {
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Slug = table.Column<string>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: true),
                    Aliases = table.Column<string>(type: "TEXT", nullable: true),
                    Path = table.Column<string>(type: "TEXT", nullable: true),
                    Overview = table.Column<string>(type: "TEXT", nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: true),
                    TrailerUrl = table.Column<string>(type: "TEXT", nullable: true),
                    StartAir = table.Column<DateTime>(type: "TEXT", nullable: true),
                    EndAir = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Poster = table.Column<string>(type: "TEXT", nullable: true),
                    Logo = table.Column<string>(type: "TEXT", nullable: true),
                    Backdrop = table.Column<string>(type: "TEXT", nullable: true),
                    IsMovie = table.Column<bool>(type: "INTEGER", nullable: false),
                    StudioID = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shows", x => x.ID);
                    table.ForeignKey(
                        name: "FK_Shows_Studios_StudioID",
                        column: x => x.StudioID,
                        principalTable: "Studios",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Link<Collection, Show>",
                columns: table => new
                {
                    FirstID = table.Column<int>(type: "INTEGER", nullable: false),
                    SecondID = table.Column<int>(type: "INTEGER", nullable: false)
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
                    FirstID = table.Column<int>(type: "INTEGER", nullable: false),
                    SecondID = table.Column<int>(type: "INTEGER", nullable: false)
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
                    FirstID = table.Column<int>(type: "INTEGER", nullable: false),
                    SecondID = table.Column<int>(type: "INTEGER", nullable: false)
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
                name: "Link<User, Show>",
                columns: table => new
                {
                    FirstID = table.Column<int>(type: "INTEGER", nullable: false),
                    SecondID = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Link<User, Show>", x => new { x.FirstID, x.SecondID });
                    table.ForeignKey(
                        name: "FK_Link<User, Show>_Shows_SecondID",
                        column: x => x.SecondID,
                        principalTable: "Shows",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Link<User, Show>_Users_FirstID",
                        column: x => x.FirstID,
                        principalTable: "Users",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MetadataID<Show>",
                columns: table => new
                {
                    FirstID = table.Column<int>(type: "INTEGER", nullable: false),
                    SecondID = table.Column<int>(type: "INTEGER", nullable: false),
                    DataID = table.Column<string>(type: "TEXT", nullable: true),
                    Link = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MetadataID<Show>", x => new { x.FirstID, x.SecondID });
                    table.ForeignKey(
                        name: "FK_MetadataID<Show>_Providers_SecondID",
                        column: x => x.SecondID,
                        principalTable: "Providers",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MetadataID<Show>_Shows_FirstID",
                        column: x => x.FirstID,
                        principalTable: "Shows",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PeopleRoles",
                columns: table => new
                {
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ForPeople = table.Column<bool>(type: "INTEGER", nullable: false),
                    PeopleID = table.Column<int>(type: "INTEGER", nullable: false),
                    ShowID = table.Column<int>(type: "INTEGER", nullable: false),
                    Type = table.Column<string>(type: "TEXT", nullable: true),
                    Role = table.Column<string>(type: "TEXT", nullable: true)
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
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Slug = table.Column<string>(type: "TEXT", nullable: true),
                    ShowID = table.Column<int>(type: "INTEGER", nullable: false),
                    SeasonNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: true),
                    Overview = table.Column<string>(type: "TEXT", nullable: true),
                    StartDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    EndDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Poster = table.Column<string>(type: "TEXT", nullable: true)
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
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Slug = table.Column<string>(type: "TEXT", nullable: true),
                    ShowID = table.Column<int>(type: "INTEGER", nullable: false),
                    SeasonID = table.Column<int>(type: "INTEGER", nullable: true),
                    SeasonNumber = table.Column<int>(type: "INTEGER", nullable: true),
                    EpisodeNumber = table.Column<int>(type: "INTEGER", nullable: true),
                    AbsoluteNumber = table.Column<int>(type: "INTEGER", nullable: true),
                    Path = table.Column<string>(type: "TEXT", nullable: true),
                    Thumb = table.Column<string>(type: "TEXT", nullable: true),
                    Title = table.Column<string>(type: "TEXT", nullable: true),
                    Overview = table.Column<string>(type: "TEXT", nullable: true),
                    ReleaseDate = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Episodes", x => x.ID);
                    table.ForeignKey(
                        name: "FK_Episodes_Seasons_SeasonID",
                        column: x => x.SeasonID,
                        principalTable: "Seasons",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Episodes_Shows_ShowID",
                        column: x => x.ShowID,
                        principalTable: "Shows",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MetadataID<Season>",
                columns: table => new
                {
                    FirstID = table.Column<int>(type: "INTEGER", nullable: false),
                    SecondID = table.Column<int>(type: "INTEGER", nullable: false),
                    DataID = table.Column<string>(type: "TEXT", nullable: true),
                    Link = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MetadataID<Season>", x => new { x.FirstID, x.SecondID });
                    table.ForeignKey(
                        name: "FK_MetadataID<Season>_Providers_SecondID",
                        column: x => x.SecondID,
                        principalTable: "Providers",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MetadataID<Season>_Seasons_FirstID",
                        column: x => x.FirstID,
                        principalTable: "Seasons",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MetadataID<Episode>",
                columns: table => new
                {
                    FirstID = table.Column<int>(type: "INTEGER", nullable: false),
                    SecondID = table.Column<int>(type: "INTEGER", nullable: false),
                    DataID = table.Column<string>(type: "TEXT", nullable: true),
                    Link = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MetadataID<Episode>", x => new { x.FirstID, x.SecondID });
                    table.ForeignKey(
                        name: "FK_MetadataID<Episode>_Episodes_FirstID",
                        column: x => x.FirstID,
                        principalTable: "Episodes",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MetadataID<Episode>_Providers_SecondID",
                        column: x => x.SecondID,
                        principalTable: "Providers",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tracks",
                columns: table => new
                {
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Slug = table.Column<string>(type: "TEXT", nullable: true),
                    Title = table.Column<string>(type: "TEXT", nullable: true),
                    Language = table.Column<string>(type: "TEXT", nullable: true),
                    Codec = table.Column<string>(type: "TEXT", nullable: true),
                    IsDefault = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsForced = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsExternal = table.Column<bool>(type: "INTEGER", nullable: false),
                    Path = table.Column<string>(type: "TEXT", nullable: true),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    EpisodeID = table.Column<int>(type: "INTEGER", nullable: false),
                    TrackIndex = table.Column<int>(type: "INTEGER", nullable: false)
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

            migrationBuilder.CreateTable(
                name: "WatchedEpisodes",
                columns: table => new
                {
                    FirstID = table.Column<int>(type: "INTEGER", nullable: false),
                    SecondID = table.Column<int>(type: "INTEGER", nullable: false),
                    WatchedPercentage = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WatchedEpisodes", x => new { x.FirstID, x.SecondID });
                    table.ForeignKey(
                        name: "FK_WatchedEpisodes_Episodes_SecondID",
                        column: x => x.SecondID,
                        principalTable: "Episodes",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WatchedEpisodes_Users_FirstID",
                        column: x => x.FirstID,
                        principalTable: "Users",
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
                name: "IX_Episodes_Slug",
                table: "Episodes",
                column: "Slug",
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
                name: "IX_Link<User, Show>_SecondID",
                table: "Link<User, Show>",
                column: "SecondID");

            migrationBuilder.CreateIndex(
                name: "IX_MetadataID<Episode>_SecondID",
                table: "MetadataID<Episode>",
                column: "SecondID");

            migrationBuilder.CreateIndex(
                name: "IX_MetadataID<People>_SecondID",
                table: "MetadataID<People>",
                column: "SecondID");

            migrationBuilder.CreateIndex(
                name: "IX_MetadataID<Season>_SecondID",
                table: "MetadataID<Season>",
                column: "SecondID");

            migrationBuilder.CreateIndex(
                name: "IX_MetadataID<Show>_SecondID",
                table: "MetadataID<Show>",
                column: "SecondID");

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
                name: "IX_Seasons_Slug",
                table: "Seasons",
                column: "Slug",
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

            migrationBuilder.CreateIndex(
                name: "IX_Tracks_Slug",
                table: "Tracks",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Slug",
                table: "Users",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WatchedEpisodes_SecondID",
                table: "WatchedEpisodes",
                column: "SecondID");
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
                name: "Link<User, Show>");

            migrationBuilder.DropTable(
                name: "MetadataID<Episode>");

            migrationBuilder.DropTable(
                name: "MetadataID<People>");

            migrationBuilder.DropTable(
                name: "MetadataID<Season>");

            migrationBuilder.DropTable(
                name: "MetadataID<Show>");

            migrationBuilder.DropTable(
                name: "PeopleRoles");

            migrationBuilder.DropTable(
                name: "Tracks");

            migrationBuilder.DropTable(
                name: "WatchedEpisodes");

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
                name: "Users");

            migrationBuilder.DropTable(
                name: "Seasons");

            migrationBuilder.DropTable(
                name: "Shows");

            migrationBuilder.DropTable(
                name: "Studios");
        }
    }
}
