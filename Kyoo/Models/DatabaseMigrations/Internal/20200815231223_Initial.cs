using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace Kyoo.Models.DatabaseMigrations.Internal
{
    public partial class Initial : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:item_type", "show,movie,collection")
                .Annotation("Npgsql:Enum:status", "finished,airing,planned,unknown")
                .Annotation("Npgsql:Enum:stream_type", "unknow,video,audio,subtitle");

            migrationBuilder.CreateTable(
                name: "Collection",
                columns: table => new
                {
                    ID = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(nullable: true),
                    Name = table.Column<string>(nullable: true),
                    Poster = table.Column<string>(nullable: true),
                    Overview = table.Column<string>(nullable: true),
                    Discriminator = table.Column<string>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Collection", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Genre",
                columns: table => new
                {
                    ID = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(nullable: true),
                    Name = table.Column<string>(nullable: true),
                    Discriminator = table.Column<string>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Genre", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Library",
                columns: table => new
                {
                    ID = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(nullable: true),
                    Name = table.Column<string>(nullable: true),
                    Paths = table.Column<string[]>(type: "text[]", nullable: true),
                    Discriminator = table.Column<string>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Library", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "People",
                columns: table => new
                {
                    ID = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(nullable: true),
                    Name = table.Column<string>(nullable: true),
                    Poster = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_People", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Providers",
                columns: table => new
                {
                    ID = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(nullable: true),
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
                    ID = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(nullable: true),
                    Name = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Studios", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "ProviderLinks",
                columns: table => new
                {
                    ID = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProviderID = table.Column<int>(nullable: false),
                    LibraryID = table.Column<int>(nullable: true),
                    LibraryDEID = table.Column<int>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProviderLinks", x => x.ID);
                    table.ForeignKey(
                        name: "FK_ProviderLinks_Library_LibraryDEID",
                        column: x => x.LibraryDEID,
                        principalTable: "Library",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProviderLinks_Library_LibraryID",
                        column: x => x.LibraryID,
                        principalTable: "Library",
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
                name: "Show",
                columns: table => new
                {
                    ID = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(nullable: true),
                    Title = table.Column<string>(nullable: true),
                    Aliases = table.Column<string[]>(type: "text[]", nullable: true),
                    Path = table.Column<string>(nullable: true),
                    Overview = table.Column<string>(nullable: true),
                    Status = table.Column<int>(nullable: true),
                    TrailerUrl = table.Column<string>(nullable: true),
                    StartYear = table.Column<int>(nullable: true),
                    EndYear = table.Column<int>(nullable: true),
                    Poster = table.Column<string>(nullable: true),
                    Logo = table.Column<string>(nullable: true),
                    Backdrop = table.Column<string>(nullable: true),
                    IsMovie = table.Column<bool>(nullable: false),
                    StudioID = table.Column<int>(nullable: true),
                    Discriminator = table.Column<string>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Show", x => x.ID);
                    table.ForeignKey(
                        name: "FK_Show_Studios_StudioID",
                        column: x => x.StudioID,
                        principalTable: "Studios",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CollectionLinks",
                columns: table => new
                {
                    ID = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CollectionID = table.Column<int>(nullable: true),
                    ShowID = table.Column<int>(nullable: false),
                    CollectionDEID = table.Column<int>(nullable: true),
                    ShowDEID = table.Column<int>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CollectionLinks", x => x.ID);
                    table.ForeignKey(
                        name: "FK_CollectionLinks_Collection_CollectionDEID",
                        column: x => x.CollectionDEID,
                        principalTable: "Collection",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CollectionLinks_Collection_CollectionID",
                        column: x => x.CollectionID,
                        principalTable: "Collection",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CollectionLinks_Show_ShowDEID",
                        column: x => x.ShowDEID,
                        principalTable: "Show",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CollectionLinks_Show_ShowID",
                        column: x => x.ShowID,
                        principalTable: "Show",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GenreLinks",
                columns: table => new
                {
                    ShowID = table.Column<int>(nullable: false),
                    GenreID = table.Column<int>(nullable: false),
                    GenreDEID = table.Column<int>(nullable: true),
                    ShowDEID = table.Column<int>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GenreLinks", x => new { x.ShowID, x.GenreID });
                    table.ForeignKey(
                        name: "FK_GenreLinks_Genre_GenreDEID",
                        column: x => x.GenreDEID,
                        principalTable: "Genre",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GenreLinks_Genre_GenreID",
                        column: x => x.GenreID,
                        principalTable: "Genre",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GenreLinks_Show_ShowDEID",
                        column: x => x.ShowDEID,
                        principalTable: "Show",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GenreLinks_Show_ShowID",
                        column: x => x.ShowID,
                        principalTable: "Show",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LibraryLinks",
                columns: table => new
                {
                    ID = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LibraryID = table.Column<int>(nullable: false),
                    ShowID = table.Column<int>(nullable: true),
                    CollectionID = table.Column<int>(nullable: true),
                    CollectionDEID = table.Column<int>(nullable: true),
                    LibraryDEID = table.Column<int>(nullable: true),
                    ShowDEID = table.Column<int>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LibraryLinks", x => x.ID);
                    table.ForeignKey(
                        name: "FK_LibraryLinks_Collection_CollectionDEID",
                        column: x => x.CollectionDEID,
                        principalTable: "Collection",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LibraryLinks_Collection_CollectionID",
                        column: x => x.CollectionID,
                        principalTable: "Collection",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LibraryLinks_Library_LibraryDEID",
                        column: x => x.LibraryDEID,
                        principalTable: "Library",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LibraryLinks_Library_LibraryID",
                        column: x => x.LibraryID,
                        principalTable: "Library",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LibraryLinks_Show_ShowDEID",
                        column: x => x.ShowDEID,
                        principalTable: "Show",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LibraryLinks_Show_ShowID",
                        column: x => x.ShowID,
                        principalTable: "Show",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PeopleRoles",
                columns: table => new
                {
                    ID = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PeopleID = table.Column<int>(nullable: false),
                    ShowID = table.Column<int>(nullable: false),
                    Role = table.Column<string>(nullable: true),
                    Type = table.Column<string>(nullable: true)
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
                        name: "FK_PeopleRoles_Show_ShowID",
                        column: x => x.ShowID,
                        principalTable: "Show",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Seasons",
                columns: table => new
                {
                    ID = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ShowID = table.Column<int>(nullable: false),
                    SeasonNumber = table.Column<int>(nullable: false),
                    Title = table.Column<string>(nullable: true),
                    Overview = table.Column<string>(nullable: true),
                    Year = table.Column<int>(nullable: true),
                    ImgPrimary = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Seasons", x => x.ID);
                    table.ForeignKey(
                        name: "FK_Seasons_Show_ShowID",
                        column: x => x.ShowID,
                        principalTable: "Show",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Episodes",
                columns: table => new
                {
                    ID = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ShowID = table.Column<int>(nullable: false),
                    SeasonID = table.Column<int>(nullable: true),
                    SeasonNumber = table.Column<int>(nullable: false),
                    EpisodeNumber = table.Column<int>(nullable: false),
                    AbsoluteNumber = table.Column<int>(nullable: false),
                    Path = table.Column<string>(nullable: true),
                    Title = table.Column<string>(nullable: true),
                    Overview = table.Column<string>(nullable: true),
                    ReleaseDate = table.Column<DateTime>(nullable: true),
                    Runtime = table.Column<int>(nullable: false),
                    Poster = table.Column<string>(nullable: true)
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
                        name: "FK_Episodes_Show_ShowID",
                        column: x => x.ShowID,
                        principalTable: "Show",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MetadataIds",
                columns: table => new
                {
                    ID = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProviderID = table.Column<int>(nullable: false),
                    ShowID = table.Column<int>(nullable: true),
                    EpisodeID = table.Column<int>(nullable: true),
                    SeasonID = table.Column<int>(nullable: true),
                    PeopleID = table.Column<int>(nullable: true),
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
                        name: "FK_MetadataIds_Show_ShowID",
                        column: x => x.ShowID,
                        principalTable: "Show",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tracks",
                columns: table => new
                {
                    ID = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(nullable: true),
                    Language = table.Column<string>(nullable: true),
                    Codec = table.Column<string>(nullable: true),
                    Path = table.Column<string>(nullable: true),
                    Type = table.Column<int>(nullable: false),
                    EpisodeID = table.Column<int>(nullable: false),
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
                name: "IX_Collection_Slug",
                table: "Collection",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CollectionLinks_CollectionDEID",
                table: "CollectionLinks",
                column: "CollectionDEID");

            migrationBuilder.CreateIndex(
                name: "IX_CollectionLinks_ShowDEID",
                table: "CollectionLinks",
                column: "ShowDEID");

            migrationBuilder.CreateIndex(
                name: "IX_CollectionLinks_ShowID",
                table: "CollectionLinks",
                column: "ShowID");

            migrationBuilder.CreateIndex(
                name: "IX_CollectionLinks_CollectionID_ShowID",
                table: "CollectionLinks",
                columns: new[] { "CollectionID", "ShowID" },
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
                name: "IX_Genre_Slug",
                table: "Genre",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GenreLinks_GenreDEID",
                table: "GenreLinks",
                column: "GenreDEID");

            migrationBuilder.CreateIndex(
                name: "IX_GenreLinks_GenreID",
                table: "GenreLinks",
                column: "GenreID");

            migrationBuilder.CreateIndex(
                name: "IX_GenreLinks_ShowDEID",
                table: "GenreLinks",
                column: "ShowDEID");

            migrationBuilder.CreateIndex(
                name: "IX_Library_Slug",
                table: "Library",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LibraryLinks_CollectionDEID",
                table: "LibraryLinks",
                column: "CollectionDEID");

            migrationBuilder.CreateIndex(
                name: "IX_LibraryLinks_CollectionID",
                table: "LibraryLinks",
                column: "CollectionID");

            migrationBuilder.CreateIndex(
                name: "IX_LibraryLinks_LibraryDEID",
                table: "LibraryLinks",
                column: "LibraryDEID");

            migrationBuilder.CreateIndex(
                name: "IX_LibraryLinks_ShowDEID",
                table: "LibraryLinks",
                column: "ShowDEID");

            migrationBuilder.CreateIndex(
                name: "IX_LibraryLinks_ShowID",
                table: "LibraryLinks",
                column: "ShowID");

            migrationBuilder.CreateIndex(
                name: "IX_LibraryLinks_LibraryID_CollectionID",
                table: "LibraryLinks",
                columns: new[] { "LibraryID", "CollectionID" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LibraryLinks_LibraryID_ShowID",
                table: "LibraryLinks",
                columns: new[] { "LibraryID", "ShowID" },
                unique: true);

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
                name: "IX_ProviderLinks_LibraryDEID",
                table: "ProviderLinks",
                column: "LibraryDEID");

            migrationBuilder.CreateIndex(
                name: "IX_ProviderLinks_LibraryID",
                table: "ProviderLinks",
                column: "LibraryID");

            migrationBuilder.CreateIndex(
                name: "IX_ProviderLinks_ProviderID",
                table: "ProviderLinks",
                column: "ProviderID");

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
                name: "IX_Show_Slug",
                table: "Show",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Show_StudioID",
                table: "Show",
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
                name: "PeopleRoles");

            migrationBuilder.DropTable(
                name: "ProviderLinks");

            migrationBuilder.DropTable(
                name: "Tracks");

            migrationBuilder.DropTable(
                name: "Genre");

            migrationBuilder.DropTable(
                name: "Collection");

            migrationBuilder.DropTable(
                name: "People");

            migrationBuilder.DropTable(
                name: "Library");

            migrationBuilder.DropTable(
                name: "Providers");

            migrationBuilder.DropTable(
                name: "Episodes");

            migrationBuilder.DropTable(
                name: "Seasons");

            migrationBuilder.DropTable(
                name: "Show");

            migrationBuilder.DropTable(
                name: "Studios");
        }
    }
}
