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
using Kyoo.Abstractions.Models;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kyoo.Postgresql.Migrations
{
	/// <inheritdoc />
	public partial class Watchlist : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterDatabase()
				.Annotation("Npgsql:Enum:genre", "action,adventure,animation,comedy,crime,documentary,drama,family,fantasy,history,horror,music,mystery,romance,science_fiction,thriller,war,western")
				.Annotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
				.Annotation("Npgsql:Enum:watch_status", "completed,watching,droped,planned")
				.OldAnnotation("Npgsql:Enum:genre", "action,adventure,animation,comedy,crime,documentary,drama,family,fantasy,history,horror,music,mystery,romance,science_fiction,thriller,war,western")
				.OldAnnotation("Npgsql:Enum:status", "unknown,finished,airing,planned");

			migrationBuilder.CreateTable(
				name: "episode_watch_status",
				columns: table => new
				{
					user_id = table.Column<Guid>(type: "uuid", nullable: false),
					episode_id = table.Column<Guid>(type: "uuid", nullable: false),
					added_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now() at time zone 'utc'"),
					played_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
					status = table.Column<WatchStatus>(type: "watch_status", nullable: false),
					watched_time = table.Column<int>(type: "integer", nullable: true),
					watched_percent = table.Column<int>(type: "integer", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_episode_watch_status", x => new { x.user_id, x.episode_id });
					table.ForeignKey(
						name: "fk_episode_watch_status_episodes_episode_id",
						column: x => x.episode_id,
						principalTable: "episodes",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_episode_watch_status_users_user_id",
						column: x => x.user_id,
						principalTable: "users",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "movie_watch_status",
				columns: table => new
				{
					user_id = table.Column<Guid>(type: "uuid", nullable: false),
					movie_id = table.Column<Guid>(type: "uuid", nullable: false),
					added_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now() at time zone 'utc'"),
					played_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
					status = table.Column<WatchStatus>(type: "watch_status", nullable: false),
					watched_time = table.Column<int>(type: "integer", nullable: true),
					watched_percent = table.Column<int>(type: "integer", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_movie_watch_status", x => new { x.user_id, x.movie_id });
					table.ForeignKey(
						name: "fk_movie_watch_status_movies_movie_id",
						column: x => x.movie_id,
						principalTable: "movies",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_movie_watch_status_users_user_id",
						column: x => x.user_id,
						principalTable: "users",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateTable(
				name: "show_watch_status",
				columns: table => new
				{
					user_id = table.Column<Guid>(type: "uuid", nullable: false),
					show_id = table.Column<Guid>(type: "uuid", nullable: false),
					added_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now() at time zone 'utc'"),
					played_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
					status = table.Column<WatchStatus>(type: "watch_status", nullable: false),
					unseen_episodes_count = table.Column<int>(type: "integer", nullable: false),
					next_episode_id = table.Column<Guid>(type: "uuid", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_show_watch_status", x => new { x.user_id, x.show_id });
					table.ForeignKey(
						name: "fk_show_watch_status_episodes_next_episode_id",
						column: x => x.next_episode_id,
						principalTable: "episodes",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_show_watch_status_shows_show_id",
						column: x => x.show_id,
						principalTable: "shows",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "fk_show_watch_status_users_user_id",
						column: x => x.user_id,
						principalTable: "users",
						principalColumn: "id",
						onDelete: ReferentialAction.Cascade);
				});

			migrationBuilder.CreateIndex(
				name: "ix_episode_watch_status_episode_id",
				table: "episode_watch_status",
				column: "episode_id");

			migrationBuilder.CreateIndex(
				name: "ix_movie_watch_status_movie_id",
				table: "movie_watch_status",
				column: "movie_id");

			migrationBuilder.CreateIndex(
				name: "ix_show_watch_status_next_episode_id",
				table: "show_watch_status",
				column: "next_episode_id");

			migrationBuilder.CreateIndex(
				name: "ix_show_watch_status_show_id",
				table: "show_watch_status",
				column: "show_id");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				name: "episode_watch_status");

			migrationBuilder.DropTable(
				name: "movie_watch_status");

			migrationBuilder.DropTable(
				name: "show_watch_status");

			migrationBuilder.AlterDatabase()
				.Annotation("Npgsql:Enum:genre", "action,adventure,animation,comedy,crime,documentary,drama,family,fantasy,history,horror,music,mystery,romance,science_fiction,thriller,war,western")
				.Annotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
				.OldAnnotation("Npgsql:Enum:genre", "action,adventure,animation,comedy,crime,documentary,drama,family,fantasy,history,horror,music,mystery,romance,science_fiction,thriller,war,western")
				.OldAnnotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
				.OldAnnotation("Npgsql:Enum:watch_status", "completed,watching,droped,planned");
		}
	}
}
