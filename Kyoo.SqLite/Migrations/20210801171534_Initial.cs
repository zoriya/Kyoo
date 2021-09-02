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
					Images = table.Column<string>(type: "TEXT", nullable: true),
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
					Images = table.Column<string>(type: "TEXT", nullable: true)
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
					Images = table.Column<string>(type: "TEXT", nullable: true)
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
					ExtraData = table.Column<string>(type: "TEXT", nullable: true),
					Images = table.Column<string>(type: "TEXT", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Users", x => x.ID);
				});

			migrationBuilder.CreateTable(
				name: "LinkLibraryCollection",
				columns: table => new
				{
					CollectionID = table.Column<int>(type: "INTEGER", nullable: false),
					LibraryID = table.Column<int>(type: "INTEGER", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_LinkLibraryCollection", x => new { x.CollectionID, x.LibraryID });
					table.ForeignKey(
						name: "FK_LinkLibraryCollection_Collections_CollectionID",
						column: x => x.CollectionID,
						principalTable: "Collections",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "FK_LinkLibraryCollection_Libraries_LibraryID",
						column: x => x.LibraryID,
						principalTable: "Libraries",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "CollectionMetadataID",
				columns: table => new
				{
					ResourceID = table.Column<int>(type: "INTEGER", nullable: false),
					ProviderID = table.Column<int>(type: "INTEGER", nullable: false),
					DataID = table.Column<string>(type: "TEXT", nullable: true),
					Link = table.Column<string>(type: "TEXT", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_CollectionMetadataID", x => new { x.ResourceID, x.ProviderID });
					table.ForeignKey(
						name: "FK_CollectionMetadataID_Collections_ResourceID",
						column: x => x.ResourceID,
						principalTable: "Collections",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "FK_CollectionMetadataID_Providers_ProviderID",
						column: x => x.ProviderID,
						principalTable: "Providers",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "LinkLibraryProvider",
				columns: table => new
				{
					LibraryID = table.Column<int>(type: "INTEGER", nullable: false),
					ProviderID = table.Column<int>(type: "INTEGER", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_LinkLibraryProvider", x => new { x.LibraryID, x.ProviderID });
					table.ForeignKey(
						name: "FK_LinkLibraryProvider_Libraries_LibraryID",
						column: x => x.LibraryID,
						principalTable: "Libraries",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "FK_LinkLibraryProvider_Providers_ProviderID",
						column: x => x.ProviderID,
						principalTable: "Providers",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "PeopleMetadataID",
				columns: table => new
				{
					ResourceID = table.Column<int>(type: "INTEGER", nullable: false),
					ProviderID = table.Column<int>(type: "INTEGER", nullable: false),
					DataID = table.Column<string>(type: "TEXT", nullable: true),
					Link = table.Column<string>(type: "TEXT", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_PeopleMetadataID", x => new { x.ResourceID, x.ProviderID });
					table.ForeignKey(
						name: "FK_PeopleMetadataID_People_ResourceID",
						column: x => x.ResourceID,
						principalTable: "People",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "FK_PeopleMetadataID_Providers_ProviderID",
						column: x => x.ProviderID,
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
					Status = table.Column<int>(type: "INTEGER", nullable: false),
					StartAir = table.Column<DateTime>(type: "TEXT", nullable: true),
					EndAir = table.Column<DateTime>(type: "TEXT", nullable: true),
					Images = table.Column<string>(type: "TEXT", nullable: true),
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
				name: "StudioMetadataID",
				columns: table => new
				{
					ResourceID = table.Column<int>(type: "INTEGER", nullable: false),
					ProviderID = table.Column<int>(type: "INTEGER", nullable: false),
					DataID = table.Column<string>(type: "TEXT", nullable: true),
					Link = table.Column<string>(type: "TEXT", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_StudioMetadataID", x => new { x.ResourceID, x.ProviderID });
					table.ForeignKey(
						name: "FK_StudioMetadataID_Providers_ProviderID",
						column: x => x.ProviderID,
						principalTable: "Providers",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "FK_StudioMetadataID_Studios_ResourceID",
						column: x => x.ResourceID,
						principalTable: "Studios",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "LinkCollectionShow",
				columns: table => new
				{
					CollectionID = table.Column<int>(type: "INTEGER", nullable: false),
					ShowID = table.Column<int>(type: "INTEGER", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_LinkCollectionShow", x => new { x.CollectionID, x.ShowID });
					table.ForeignKey(
						name: "FK_LinkCollectionShow_Collections_CollectionID",
						column: x => x.CollectionID,
						principalTable: "Collections",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "FK_LinkCollectionShow_Shows_ShowID",
						column: x => x.ShowID,
						principalTable: "Shows",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "LinkLibraryShow",
				columns: table => new
				{
					LibraryID = table.Column<int>(type: "INTEGER", nullable: false),
					ShowID = table.Column<int>(type: "INTEGER", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_LinkLibraryShow", x => new { x.LibraryID, x.ShowID });
					table.ForeignKey(
						name: "FK_LinkLibraryShow_Libraries_LibraryID",
						column: x => x.LibraryID,
						principalTable: "Libraries",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "FK_LinkLibraryShow_Shows_ShowID",
						column: x => x.ShowID,
						principalTable: "Shows",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "LinkShowGenre",
				columns: table => new
				{
					GenreID = table.Column<int>(type: "INTEGER", nullable: false),
					ShowID = table.Column<int>(type: "INTEGER", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_LinkShowGenre", x => new { x.GenreID, x.ShowID });
					table.ForeignKey(
						name: "FK_LinkShowGenre_Genres_GenreID",
						column: x => x.GenreID,
						principalTable: "Genres",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "FK_LinkShowGenre_Shows_ShowID",
						column: x => x.ShowID,
						principalTable: "Shows",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "LinkUserShow",
				columns: table => new
				{
					UsersID = table.Column<int>(type: "INTEGER", nullable: false),
					WatchedID = table.Column<int>(type: "INTEGER", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_LinkUserShow", x => new { x.UsersID, x.WatchedID });
					table.ForeignKey(
						name: "FK_LinkUserShow_Shows_WatchedID",
						column: x => x.WatchedID,
						principalTable: "Shows",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "FK_LinkUserShow_Users_UsersID",
						column: x => x.UsersID,
						principalTable: "Users",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "PeopleRoles",
				columns: table => new
				{
					ID = table.Column<int>(type: "INTEGER", nullable: false)
						.Annotation("Sqlite:Autoincrement", true),
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
					Images = table.Column<string>(type: "TEXT", nullable: true)
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
				name: "ShowMetadataID",
				columns: table => new
				{
					ResourceID = table.Column<int>(type: "INTEGER", nullable: false),
					ProviderID = table.Column<int>(type: "INTEGER", nullable: false),
					DataID = table.Column<string>(type: "TEXT", nullable: true),
					Link = table.Column<string>(type: "TEXT", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_ShowMetadataID", x => new { x.ResourceID, x.ProviderID });
					table.ForeignKey(
						name: "FK_ShowMetadataID_Providers_ProviderID",
						column: x => x.ProviderID,
						principalTable: "Providers",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "FK_ShowMetadataID_Shows_ResourceID",
						column: x => x.ResourceID,
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
					Images = table.Column<string>(type: "TEXT", nullable: true),
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
				name: "SeasonMetadataID",
				columns: table => new
				{
					ResourceID = table.Column<int>(type: "INTEGER", nullable: false),
					ProviderID = table.Column<int>(type: "INTEGER", nullable: false),
					DataID = table.Column<string>(type: "TEXT", nullable: true),
					Link = table.Column<string>(type: "TEXT", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_SeasonMetadataID", x => new { x.ResourceID, x.ProviderID });
					table.ForeignKey(
						name: "FK_SeasonMetadataID_Providers_ProviderID",
						column: x => x.ProviderID,
						principalTable: "Providers",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "FK_SeasonMetadataID_Seasons_ResourceID",
						column: x => x.ResourceID,
						principalTable: "Seasons",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "EpisodeMetadataID",
				columns: table => new
				{
					ResourceID = table.Column<int>(type: "INTEGER", nullable: false),
					ProviderID = table.Column<int>(type: "INTEGER", nullable: false),
					DataID = table.Column<string>(type: "TEXT", nullable: true),
					Link = table.Column<string>(type: "TEXT", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_EpisodeMetadataID", x => new { x.ResourceID, x.ProviderID });
					table.ForeignKey(
						name: "FK_EpisodeMetadataID_Episodes_ResourceID",
						column: x => x.ResourceID,
						principalTable: "Episodes",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "FK_EpisodeMetadataID_Providers_ProviderID",
						column: x => x.ProviderID,
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
					UserID = table.Column<int>(type: "INTEGER", nullable: false),
					EpisodeID = table.Column<int>(type: "INTEGER", nullable: false),
					WatchedPercentage = table.Column<int>(type: "INTEGER", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_WatchedEpisodes", x => new { x.UserID, x.EpisodeID });
					table.ForeignKey(
						name: "FK_WatchedEpisodes_Episodes_EpisodeID",
						column: x => x.EpisodeID,
						principalTable: "Episodes",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "FK_WatchedEpisodes_Users_UserID",
						column: x => x.UserID,
						principalTable: "Users",
						principalColumn: "ID",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateIndex(
				name: "IX_CollectionMetadataID_ProviderID",
				table: "CollectionMetadataID",
				column: "ProviderID");

			migrationBuilder.CreateIndex(
				name: "IX_Collections_Slug",
				table: "Collections",
				column: "Slug",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "IX_EpisodeMetadataID_ProviderID",
				table: "EpisodeMetadataID",
				column: "ProviderID");

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
				name: "IX_LinkCollectionShow_ShowID",
				table: "LinkCollectionShow",
				column: "ShowID");

			migrationBuilder.CreateIndex(
				name: "IX_LinkLibraryCollection_LibraryID",
				table: "LinkLibraryCollection",
				column: "LibraryID");

			migrationBuilder.CreateIndex(
				name: "IX_LinkLibraryProvider_ProviderID",
				table: "LinkLibraryProvider",
				column: "ProviderID");

			migrationBuilder.CreateIndex(
				name: "IX_LinkLibraryShow_ShowID",
				table: "LinkLibraryShow",
				column: "ShowID");

			migrationBuilder.CreateIndex(
				name: "IX_LinkShowGenre_ShowID",
				table: "LinkShowGenre",
				column: "ShowID");

			migrationBuilder.CreateIndex(
				name: "IX_LinkUserShow_WatchedID",
				table: "LinkUserShow",
				column: "WatchedID");

			migrationBuilder.CreateIndex(
				name: "IX_People_Slug",
				table: "People",
				column: "Slug",
				unique: true);

			migrationBuilder.CreateIndex(
				name: "IX_PeopleMetadataID_ProviderID",
				table: "PeopleMetadataID",
				column: "ProviderID");

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
				name: "IX_SeasonMetadataID_ProviderID",
				table: "SeasonMetadataID",
				column: "ProviderID");

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
				name: "IX_ShowMetadataID_ProviderID",
				table: "ShowMetadataID",
				column: "ProviderID");

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
				name: "IX_StudioMetadataID_ProviderID",
				table: "StudioMetadataID",
				column: "ProviderID");

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
				name: "IX_WatchedEpisodes_EpisodeID",
				table: "WatchedEpisodes",
				column: "EpisodeID");
		}

		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				name: "CollectionMetadataID");

			migrationBuilder.DropTable(
				name: "EpisodeMetadataID");

			migrationBuilder.DropTable(
				name: "LinkCollectionShow");

			migrationBuilder.DropTable(
				name: "LinkLibraryCollection");

			migrationBuilder.DropTable(
				name: "LinkLibraryProvider");

			migrationBuilder.DropTable(
				name: "LinkLibraryShow");

			migrationBuilder.DropTable(
				name: "LinkShowGenre");

			migrationBuilder.DropTable(
				name: "LinkUserShow");

			migrationBuilder.DropTable(
				name: "PeopleMetadataID");

			migrationBuilder.DropTable(
				name: "PeopleRoles");

			migrationBuilder.DropTable(
				name: "SeasonMetadataID");

			migrationBuilder.DropTable(
				name: "ShowMetadataID");

			migrationBuilder.DropTable(
				name: "StudioMetadataID");

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
				name: "People");

			migrationBuilder.DropTable(
				name: "Providers");

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
