using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kyoo.Postgresql.Migrations;

/// <inheritdoc />
public partial class UseDateOnly : Migration
{
	/// <inheritdoc />
	protected override void Up(MigrationBuilder migrationBuilder)
	{
		migrationBuilder
			.AlterDatabase()
			.Annotation(
				"Npgsql:Enum:genre",
				"action,adventure,animation,comedy,crime,documentary,drama,family,fantasy,history,horror,music,mystery,romance,science_fiction,thriller,war,western"
			)
			.Annotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
			.Annotation("Npgsql:Enum:watch_status", "completed,watching,droped,planned,deleted")
			.OldAnnotation(
				"Npgsql:Enum:genre",
				"action,adventure,animation,comedy,crime,documentary,drama,family,fantasy,history,horror,music,mystery,romance,science_fiction,thriller,war,western"
			)
			.OldAnnotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
			.OldAnnotation("Npgsql:Enum:watch_status", "completed,watching,droped,planned");

		migrationBuilder.AlterColumn<DateOnly>(
			name: "start_air",
			table: "shows",
			type: "date",
			nullable: true,
			oldClrType: typeof(DateTime),
			oldType: "timestamp with time zone",
			oldNullable: true
		);

		migrationBuilder.AlterColumn<DateOnly>(
			name: "end_air",
			table: "shows",
			type: "date",
			nullable: true,
			oldClrType: typeof(DateTime),
			oldType: "timestamp with time zone",
			oldNullable: true
		);

		migrationBuilder.AlterColumn<DateOnly>(
			name: "start_date",
			table: "seasons",
			type: "date",
			nullable: true,
			oldClrType: typeof(DateTime),
			oldType: "timestamp with time zone",
			oldNullable: true
		);

		migrationBuilder.AlterColumn<DateOnly>(
			name: "end_date",
			table: "seasons",
			type: "date",
			nullable: true,
			oldClrType: typeof(DateTime),
			oldType: "timestamp with time zone",
			oldNullable: true
		);

		migrationBuilder.AlterColumn<DateOnly>(
			name: "air_date",
			table: "movies",
			type: "date",
			nullable: true,
			oldClrType: typeof(DateTime),
			oldType: "timestamp with time zone",
			oldNullable: true
		);

		migrationBuilder.AlterColumn<DateOnly>(
			name: "release_date",
			table: "episodes",
			type: "date",
			nullable: true,
			oldClrType: typeof(DateTime),
			oldType: "timestamp with time zone",
			oldNullable: true
		);

		migrationBuilder.CreateIndex(
			name: "ix_users_username",
			table: "users",
			column: "username",
			unique: true
		);
	}

	/// <inheritdoc />
	protected override void Down(MigrationBuilder migrationBuilder)
	{
		migrationBuilder.DropIndex(name: "ix_users_username", table: "users");

		migrationBuilder
			.AlterDatabase()
			.Annotation(
				"Npgsql:Enum:genre",
				"action,adventure,animation,comedy,crime,documentary,drama,family,fantasy,history,horror,music,mystery,romance,science_fiction,thriller,war,western"
			)
			.Annotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
			.Annotation("Npgsql:Enum:watch_status", "completed,watching,droped,planned")
			.OldAnnotation(
				"Npgsql:Enum:genre",
				"action,adventure,animation,comedy,crime,documentary,drama,family,fantasy,history,horror,music,mystery,romance,science_fiction,thriller,war,western"
			)
			.OldAnnotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
			.OldAnnotation(
				"Npgsql:Enum:watch_status",
				"completed,watching,droped,planned,deleted"
			);

		migrationBuilder.AlterColumn<DateTime>(
			name: "start_air",
			table: "shows",
			type: "timestamp with time zone",
			nullable: true,
			oldClrType: typeof(DateOnly),
			oldType: "date",
			oldNullable: true
		);

		migrationBuilder.AlterColumn<DateTime>(
			name: "end_air",
			table: "shows",
			type: "timestamp with time zone",
			nullable: true,
			oldClrType: typeof(DateOnly),
			oldType: "date",
			oldNullable: true
		);

		migrationBuilder.AlterColumn<DateTime>(
			name: "start_date",
			table: "seasons",
			type: "timestamp with time zone",
			nullable: true,
			oldClrType: typeof(DateOnly),
			oldType: "date",
			oldNullable: true
		);

		migrationBuilder.AlterColumn<DateTime>(
			name: "end_date",
			table: "seasons",
			type: "timestamp with time zone",
			nullable: true,
			oldClrType: typeof(DateOnly),
			oldType: "date",
			oldNullable: true
		);

		migrationBuilder.AlterColumn<DateTime>(
			name: "air_date",
			table: "movies",
			type: "timestamp with time zone",
			nullable: true,
			oldClrType: typeof(DateOnly),
			oldType: "date",
			oldNullable: true
		);

		migrationBuilder.AlterColumn<DateTime>(
			name: "release_date",
			table: "episodes",
			type: "timestamp with time zone",
			nullable: true,
			oldClrType: typeof(DateOnly),
			oldType: "date",
			oldNullable: true
		);
	}
}
