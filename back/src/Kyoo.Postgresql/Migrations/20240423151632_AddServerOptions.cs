using System;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kyoo.Postgresql.Migrations
{
	/// <inheritdoc />
	public partial class AddServerOptions : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.CreateTable(
				name: "options",
				columns: table => new
				{
					key = table.Column<string>(type: "text", nullable: false),
					value = table.Column<string>(type: "text", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_options", x => x.key);
				}
			);
			byte[] secret = new byte[128];
			using var rng = RandomNumberGenerator.Create();
			rng.GetBytes(secret);
			migrationBuilder.InsertData(
				"options",
				new[] { "key", "value" },
				new[] { "AUTHENTICATION_SECRET", Convert.ToBase64String(secret) }
			);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(name: "options");
		}
	}
}
