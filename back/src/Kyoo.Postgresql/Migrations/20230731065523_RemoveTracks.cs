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

using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Kyoo.Postgresql.Migrations
{
	/// <inheritdoc />
	public partial class RemoveTracks : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(
				name: "tracks");

			migrationBuilder.AlterDatabase()
				.Annotation("Npgsql:Enum:item_type", "show,movie,collection")
				.Annotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
				.OldAnnotation("Npgsql:Enum:item_type", "show,movie,collection")
				.OldAnnotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
				.OldAnnotation("Npgsql:Enum:stream_type", "unknown,video,audio,subtitle");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterDatabase()
				.Annotation("Npgsql:Enum:item_type", "show,movie,collection")
				.Annotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
				.Annotation("Npgsql:Enum:stream_type", "unknown,video,audio,subtitle")
				.OldAnnotation("Npgsql:Enum:item_type", "show,movie,collection")
				.OldAnnotation("Npgsql:Enum:status", "unknown,finished,airing,planned");

			migrationBuilder.CreateTable(
				name: "tracks",
				columns: table => new
				{
					id = table.Column<int>(type: "integer", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					episode_id = table.Column<int>(type: "integer", nullable: false),
					codec = table.Column<string>(type: "text", nullable: true),
					is_default = table.Column<bool>(type: "boolean", nullable: false),
					is_external = table.Column<bool>(type: "boolean", nullable: false),
					is_forced = table.Column<bool>(type: "boolean", nullable: false),
					language = table.Column<string>(type: "text", nullable: true),
					path = table.Column<string>(type: "text", nullable: true),
					slug = table.Column<string>(type: "text", nullable: false),
					title = table.Column<string>(type: "text", nullable: true),
					track_index = table.Column<int>(type: "integer", nullable: false),
					type = table.Column<string>(type: "stream_type", nullable: true)
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
		}
	}
}
