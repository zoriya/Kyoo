using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kyoo.Postgresql.Migrations
{
	/// <inheritdoc />
	public partial class RuntimeNullable : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterColumn<int>(
				name: "runtime",
				table: "movies",
				type: "integer",
				nullable: true,
				oldClrType: typeof(int),
				oldType: "integer"
			);

			migrationBuilder.AlterColumn<int>(
				name: "runtime",
				table: "episodes",
				type: "integer",
				nullable: true,
				oldClrType: typeof(int),
				oldType: "integer"
			);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterColumn<int>(
				name: "runtime",
				table: "movies",
				type: "integer",
				nullable: false,
				defaultValue: 0,
				oldClrType: typeof(int),
				oldType: "integer",
				oldNullable: true
			);

			migrationBuilder.AlterColumn<int>(
				name: "runtime",
				table: "episodes",
				type: "integer",
				nullable: false,
				defaultValue: 0,
				oldClrType: typeof(int),
				oldType: "integer",
				oldNullable: true
			);
		}
	}
}
