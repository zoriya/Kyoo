using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Kyoo.Models.DatabaseMigrations.Internal
{
    public partial class Initial : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Genres",
                columns: table => new
                {
                    ID = table.Column<long>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Slug = table.Column<string>(nullable: true),
                    Name = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Genres", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Libraries",
                columns: table => new
                {
                    ID = table.Column<long>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Slug = table.Column<string>(nullable: true),
                    Name = table.Column<string>(nullable: true),
                    Paths = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Libraries", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Peoples",
                columns: table => new
                {
                    ID = table.Column<long>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Slug = table.Column<string>(nullable: true),
                    Name = table.Column<string>(nullable: true),
                    ImgPrimary = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Peoples", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Providers",
                columns: table => new
                {
                    ID = table.Column<long>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(nullable: true),
                    Logo = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Providers", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Studios",
                columns: table => new
                {
                    ID = table.Column<long>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Slug = table.Column<string>(nullable: true),
                    Name = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Studios", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Collections",
                columns: table => new
                {
                    ID = table.Column<long>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Slug = table.Column<string>(nullable: true),
                    Name = table.Column<string>(nullable: true),
                    Poster = table.Column<string>(nullable: true),
                    Overview = table.Column<string>(nullable: true),
                    ImgPrimary = table.Column<string>(nullable: true),
                    LibraryID = table.Column<long>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Collections", x => x.ID);
                    table.ForeignKey(
                        name: "FK_Collections_Libraries_LibraryID",
                        column: x => x.LibraryID,
                        principalTable: "Libraries",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProviderLinks",
                columns: table => new
                {
                    ID = table.Column<long>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProviderID = table.Column<long>(nullable: false),
                    LibraryID = table.Column<long>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProviderLinks", x => x.ID);
                    table.ForeignKey(
                        name: "FK_ProviderLinks_Libraries_LibraryID",
                        column: x => x.LibraryID,
                        principalTable: "Libraries",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProviderLinks_Providers_ProviderID",
                        column: x => x.ProviderID,
                        principalTable: "Providers",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Shows",
                columns: table => new
                {
                    ID = table.Column<long>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Slug = table.Column<string>(nullable: true),
                    Title = table.Column<string>(nullable: true),
                    Aliases = table.Column<string>(nullable: true),
                    Path = table.Column<string>(nullable: true),
                    Overview = table.Column<string>(nullable: true),
                    Status = table.Column<int>(nullable: true),
                    TrailerUrl = table.Column<string>(nullable: true),
                    StartYear = table.Column<long>(nullable: true),
                    EndYear = table.Column<long>(nullable: true),
                    Poster = table.Column<string>(nullable: true),
                    Logo = table.Column<string>(nullable: true),
                    Backdrop = table.Column<string>(nullable: true),
                    IsMovie = table.Column<bool>(nullable: false),
                    StudioID = table.Column<long>(nullable: true),
                    LibraryID = table.Column<long>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shows", x => x.ID);
                    table.ForeignKey(
                        name: "FK_Shows_Libraries_LibraryID",
                        column: x => x.LibraryID,
                        principalTable: "Libraries",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Shows_Studios_StudioID",
                        column: x => x.StudioID,
                        principalTable: "Studios",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CollectionLinks",
                columns: table => new
                {
                    ID = table.Column<long>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CollectionID = table.Column<long>(nullable: true),
                    ShowID = table.Column<long>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CollectionLinks", x => x.ID);
                    table.ForeignKey(
                        name: "FK_CollectionLinks_Collections_CollectionID",
                        column: x => x.CollectionID,
                        principalTable: "Collections",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CollectionLinks_Shows_ShowID",
                        column: x => x.ShowID,
                        principalTable: "Shows",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GenreLinks",
                columns: table => new
                {
                    ShowID = table.Column<long>(nullable: false),
                    GenreID = table.Column<long>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GenreLinks", x => new { x.ShowID, x.GenreID });
                    table.ForeignKey(
                        name: "FK_GenreLinks_Genres_GenreID",
                        column: x => x.GenreID,
                        principalTable: "Genres",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GenreLinks_Shows_ShowID",
                        column: x => x.ShowID,
                        principalTable: "Shows",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LibraryLinks",
                columns: table => new
                {
                    ID = table.Column<long>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    LibraryID = table.Column<long>(nullable: false),
                    ShowID = table.Column<long>(nullable: true),
                    CollectionID = table.Column<long>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LibraryLinks", x => x.ID);
                    table.ForeignKey(
                        name: "FK_LibraryLinks_Collections_CollectionID",
                        column: x => x.CollectionID,
                        principalTable: "Collections",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LibraryLinks_Libraries_LibraryID",
                        column: x => x.LibraryID,
                        principalTable: "Libraries",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LibraryLinks_Shows_ShowID",
                        column: x => x.ShowID,
                        principalTable: "Shows",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PeopleLinks",
                columns: table => new
                {
                    ID = table.Column<long>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PeopleID = table.Column<long>(nullable: false),
                    ShowID = table.Column<long>(nullable: false),
                    Role = table.Column<string>(nullable: true),
                    Type = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PeopleLinks", x => x.ID);
                    table.ForeignKey(
                        name: "FK_PeopleLinks_Peoples_PeopleID",
                        column: x => x.PeopleID,
                        principalTable: "Peoples",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PeopleLinks_Shows_ShowID",
                        column: x => x.ShowID,
                        principalTable: "Shows",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Seasons",
                columns: table => new
                {
                    ID = table.Column<long>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ShowID = table.Column<long>(nullable: false),
                    SeasonNumber = table.Column<long>(nullable: false),
                    Title = table.Column<string>(nullable: true),
                    Overview = table.Column<string>(nullable: true),
                    Year = table.Column<long>(nullable: true),
                    ImgPrimary = table.Column<string>(nullable: true)
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
                    ID = table.Column<long>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ShowID = table.Column<long>(nullable: false),
                    SeasonID = table.Column<long>(nullable: true),
                    SeasonNumber = table.Column<long>(nullable: false),
                    EpisodeNumber = table.Column<long>(nullable: false),
                    AbsoluteNumber = table.Column<long>(nullable: false),
                    Path = table.Column<string>(nullable: true),
                    Title = table.Column<string>(nullable: true),
                    Overview = table.Column<string>(nullable: true),
                    ReleaseDate = table.Column<DateTime>(nullable: true),
                    Runtime = table.Column<long>(nullable: false),
                    ImgPrimary = table.Column<string>(nullable: true)
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
                    ID = table.Column<long>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProviderID = table.Column<long>(nullable: false),
                    ShowID = table.Column<long>(nullable: true),
                    EpisodeID = table.Column<long>(nullable: true),
                    SeasonID = table.Column<long>(nullable: true),
                    PeopleID = table.Column<long>(nullable: true),
                    DataID = table.Column<string>(nullable: true),
                    Link = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MetadataIds", x => x.ID);
                    table.ForeignKey(
                        name: "FK_MetadataIds_Episodes_EpisodeID",
                        column: x => x.EpisodeID,
                        principalTable: "Episodes",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MetadataIds_Peoples_PeopleID",
                        column: x => x.PeopleID,
                        principalTable: "Peoples",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
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
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MetadataIds_Shows_ShowID",
                        column: x => x.ShowID,
                        principalTable: "Shows",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Tracks",
                columns: table => new
                {
                    ID = table.Column<long>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Title = table.Column<string>(nullable: true),
                    Language = table.Column<string>(nullable: true),
                    Codec = table.Column<string>(nullable: true),
                    Path = table.Column<string>(nullable: true),
                    Type = table.Column<int>(nullable: false),
                    EpisodeID = table.Column<long>(nullable: false),
                    IsDefault = table.Column<bool>(nullable: false),
                    IsForced = table.Column<bool>(nullable: false),
                    IsExternal = table.Column<bool>(nullable: false)
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
                name: "IX_CollectionLinks_CollectionID",
                table: "CollectionLinks",
                column: "CollectionID");

            migrationBuilder.CreateIndex(
                name: "IX_CollectionLinks_ShowID",
                table: "CollectionLinks",
                column: "ShowID");

            migrationBuilder.CreateIndex(
                name: "IX_Collections_LibraryID",
                table: "Collections",
                column: "LibraryID");

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
                name: "IX_Episodes_ShowID",
                table: "Episodes",
                column: "ShowID");

            migrationBuilder.CreateIndex(
                name: "IX_GenreLinks_GenreID",
                table: "GenreLinks",
                column: "GenreID");

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
                name: "IX_LibraryLinks_CollectionID",
                table: "LibraryLinks",
                column: "CollectionID");

            migrationBuilder.CreateIndex(
                name: "IX_LibraryLinks_LibraryID",
                table: "LibraryLinks",
                column: "LibraryID");

            migrationBuilder.CreateIndex(
                name: "IX_LibraryLinks_ShowID",
                table: "LibraryLinks",
                column: "ShowID");

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
                name: "IX_PeopleLinks_PeopleID",
                table: "PeopleLinks",
                column: "PeopleID");

            migrationBuilder.CreateIndex(
                name: "IX_PeopleLinks_ShowID",
                table: "PeopleLinks",
                column: "ShowID");

            migrationBuilder.CreateIndex(
                name: "IX_Peoples_Slug",
                table: "Peoples",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProviderLinks_LibraryID",
                table: "ProviderLinks",
                column: "LibraryID");

            migrationBuilder.CreateIndex(
                name: "IX_ProviderLinks_ProviderID",
                table: "ProviderLinks",
                column: "ProviderID");

            migrationBuilder.CreateIndex(
                name: "IX_Providers_Name",
                table: "Providers",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Seasons_ShowID",
                table: "Seasons",
                column: "ShowID");

            migrationBuilder.CreateIndex(
                name: "IX_Shows_LibraryID",
                table: "Shows",
                column: "LibraryID");

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
                name: "IX_Tracks_EpisodeID",
                table: "Tracks",
                column: "EpisodeID");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CollectionLinks");

            migrationBuilder.DropTable(
                name: "GenreLinks");

            migrationBuilder.DropTable(
                name: "LibraryLinks");

            migrationBuilder.DropTable(
                name: "MetadataIds");

            migrationBuilder.DropTable(
                name: "PeopleLinks");

            migrationBuilder.DropTable(
                name: "ProviderLinks");

            migrationBuilder.DropTable(
                name: "Tracks");

            migrationBuilder.DropTable(
                name: "Genres");

            migrationBuilder.DropTable(
                name: "Collections");

            migrationBuilder.DropTable(
                name: "Peoples");

            migrationBuilder.DropTable(
                name: "Providers");

            migrationBuilder.DropTable(
                name: "Episodes");

            migrationBuilder.DropTable(
                name: "Seasons");

            migrationBuilder.DropTable(
                name: "Shows");

            migrationBuilder.DropTable(
                name: "Libraries");

            migrationBuilder.DropTable(
                name: "Studios");
        }
    }
}
