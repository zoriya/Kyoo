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

namespace Kyoo.Postgresql.Migrations
{
	/// <summary>
	/// Remove triggers
	/// </summary>
	public partial class RemoveTriggers : Migration
	{
		/// <inheritdoc/>
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterColumn<string>(
				name: "slug",
				table: "tracks",
				type: "text",
				nullable: false,
				defaultValue: string.Empty,
				oldClrType: typeof(string),
				oldType: "text",
				oldNullable: true);

			migrationBuilder.AlterColumn<string>(
				name: "slug",
				table: "seasons",
				type: "text",
				nullable: false,
				defaultValue: string.Empty,
				oldClrType: typeof(string),
				oldType: "text",
				oldNullable: true);

			migrationBuilder.AlterColumn<string>(
				name: "slug",
				table: "episodes",
				type: "text",
				nullable: false,
				defaultValue: string.Empty,
				oldClrType: typeof(string),
				oldType: "text",
				oldNullable: true);

			// language=PostgreSQL
			migrationBuilder.Sql("DROP TRIGGER show_slug_trigger ON shows;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP FUNCTION show_slug_update;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP TRIGGER season_slug_trigger ON seasons;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP FUNCTION season_slug_update;");
			// language=PostgreSQL
			migrationBuilder.Sql("DROP TRIGGER episode_slug_trigger ON episodes;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP FUNCTION episode_slug_update;");
			// language=PostgreSQL
			migrationBuilder.Sql("DROP TRIGGER track_slug_trigger ON tracks;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP FUNCTION track_slug_update;");
			// language=PostgreSQL
			migrationBuilder.Sql("DROP TRIGGER episode_track_slug_trigger ON episodes;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP FUNCTION episode_update_tracks_slug;");
		}

		/// <inheritdoc/>
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterColumn<string>(
				name: "slug",
				table: "tracks",
				type: "text",
				nullable: true,
				oldClrType: typeof(string),
				oldType: "text");

			migrationBuilder.AlterColumn<string>(
				name: "slug",
				table: "seasons",
				type: "text",
				nullable: true,
				oldClrType: typeof(string),
				oldType: "text");

			migrationBuilder.AlterColumn<string>(
				name: "slug",
				table: "episodes",
				type: "text",
				nullable: true,
				oldClrType: typeof(string),
				oldType: "text");
		}
	}
}
