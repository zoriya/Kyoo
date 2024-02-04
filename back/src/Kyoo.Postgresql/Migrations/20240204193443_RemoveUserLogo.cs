using Microsoft.EntityFrameworkCore.Migrations;

namespace Kyoo.Postgresql.Migrations
{
	/// <inheritdoc />
	public partial class RemoveUserLogo : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropColumn(name: "logo_blurhash", table: "users");

			migrationBuilder.DropColumn(name: "logo_source", table: "users");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AddColumn<string>(
				name: "logo_blurhash",
				table: "users",
				type: "character varying(32)",
				maxLength: 32,
				nullable: true
			);

			migrationBuilder.AddColumn<string>(
				name: "logo_source",
				table: "users",
				type: "text",
				nullable: true
			);
		}
	}
}
