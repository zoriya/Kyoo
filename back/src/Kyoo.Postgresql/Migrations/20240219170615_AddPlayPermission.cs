using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kyoo.Postgresql.Migrations;

/// <inheritdoc />
public partial class AddPlayPermission : Migration
{
	/// <inheritdoc />
	protected override void Up(MigrationBuilder migrationBuilder)
	{
		// language=PostgreSQL
		migrationBuilder.Sql(
			"update users set permissions = ARRAY_APPEND(permissions, 'overall.play');"
		);
	}

	/// <inheritdoc />
	protected override void Down(MigrationBuilder migrationBuilder) { }
}
