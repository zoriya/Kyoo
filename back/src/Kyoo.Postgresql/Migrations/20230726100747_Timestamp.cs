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
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kyoo.Postgresql.Migrations
{
	/// <inheritdoc />
	public partial class Timestamp : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			MigrationHelper.DropLibraryItemsView(migrationBuilder);

			migrationBuilder.AlterColumn<DateTime>(
				name: "start_air",
				table: "shows",
				type: "timestamp with time zone",
				nullable: true,
				oldClrType: typeof(DateTime),
				oldType: "timestamp without time zone",
				oldNullable: true);

			migrationBuilder.AlterColumn<DateTime>(
				name: "end_air",
				table: "shows",
				type: "timestamp with time zone",
				nullable: true,
				oldClrType: typeof(DateTime),
				oldType: "timestamp without time zone",
				oldNullable: true);

			migrationBuilder.AlterColumn<DateTime>(
				name: "start_date",
				table: "seasons",
				type: "timestamp with time zone",
				nullable: true,
				oldClrType: typeof(DateTime),
				oldType: "timestamp without time zone",
				oldNullable: true);

			migrationBuilder.AlterColumn<DateTime>(
				name: "end_date",
				table: "seasons",
				type: "timestamp with time zone",
				nullable: true,
				oldClrType: typeof(DateTime),
				oldType: "timestamp without time zone",
				oldNullable: true);

			migrationBuilder.AlterColumn<DateTime>(
				name: "release_date",
				table: "episodes",
				type: "timestamp with time zone",
				nullable: true,
				oldClrType: typeof(DateTime),
				oldType: "timestamp without time zone",
				oldNullable: true);

			MigrationHelper.CreateLibraryItemsView(migrationBuilder);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			MigrationHelper.DropLibraryItemsView(migrationBuilder);

			migrationBuilder.AlterColumn<DateTime>(
				name: "start_air",
				table: "shows",
				type: "timestamp without time zone",
				nullable: true,
				oldClrType: typeof(DateTime),
				oldType: "timestamp with time zone",
				oldNullable: true);

			migrationBuilder.AlterColumn<DateTime>(
				name: "end_air",
				table: "shows",
				type: "timestamp without time zone",
				nullable: true,
				oldClrType: typeof(DateTime),
				oldType: "timestamp with time zone",
				oldNullable: true);

			migrationBuilder.AlterColumn<DateTime>(
				name: "start_date",
				table: "seasons",
				type: "timestamp without time zone",
				nullable: true,
				oldClrType: typeof(DateTime),
				oldType: "timestamp with time zone",
				oldNullable: true);

			migrationBuilder.AlterColumn<DateTime>(
				name: "end_date",
				table: "seasons",
				type: "timestamp without time zone",
				nullable: true,
				oldClrType: typeof(DateTime),
				oldType: "timestamp with time zone",
				oldNullable: true);

			migrationBuilder.AlterColumn<DateTime>(
				name: "release_date",
				table: "episodes",
				type: "timestamp without time zone",
				nullable: true,
				oldClrType: typeof(DateTime),
				oldType: "timestamp with time zone",
				oldNullable: true);

			MigrationHelper.CreateLibraryItemsView(migrationBuilder);
		}
	}
}
