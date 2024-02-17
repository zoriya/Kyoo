using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kyoo.Postgresql.Migrations
{
	/// <inheritdoc />
	public partial class AddIssues : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropForeignKey(
				name: "fk_show_watch_status_episodes_next_episode_id",
				table: "show_watch_status"
			);

			migrationBuilder.CreateTable(
				name: "issues",
				columns: table => new
				{
					domain = table.Column<string>(type: "text", nullable: false),
					cause = table.Column<string>(type: "text", nullable: false),
					reason = table.Column<string>(type: "text", nullable: false),
					extra = table.Column<string>(type: "json", nullable: false),
					added_date = table.Column<DateTime>(
						type: "timestamp with time zone",
						nullable: false,
						defaultValueSql: "now() at time zone 'utc'"
					)
				},
				constraints: table =>
				{
					table.PrimaryKey("pk_issues", x => new { x.domain, x.cause });
				}
			);

			migrationBuilder.AddForeignKey(
				name: "fk_show_watch_status_episodes_next_episode_id",
				table: "show_watch_status",
				column: "next_episode_id",
				principalTable: "episodes",
				principalColumn: "id",
				onDelete: ReferentialAction.SetNull
			);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropForeignKey(
				name: "fk_show_watch_status_episodes_next_episode_id",
				table: "show_watch_status"
			);

			migrationBuilder.DropTable(name: "issues");

			migrationBuilder.AddForeignKey(
				name: "fk_show_watch_status_episodes_next_episode_id",
				table: "show_watch_status",
				column: "next_episode_id",
				principalTable: "episodes",
				principalColumn: "id"
			);
		}
	}
}
