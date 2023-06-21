using Microsoft.EntityFrameworkCore.Migrations;

namespace Kyoo.Postgresql.Migrations
{
	public partial class RemoveTrigers : Migration
	{
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterDatabase()
				.Annotation("Npgsql:Enum:item_type", "show,movie,collection")
				.Annotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
				.Annotation("Npgsql:Enum:stream_type", "unknown,video,audio,subtitle")
				.OldAnnotation("Npgsql:Enum:item_type", "show,movie,collection")
				.OldAnnotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
				.OldAnnotation("Npgsql:Enum:stream_type", "unknown,video,audio,subtitle,attachment");

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

		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterDatabase()
				.Annotation("Npgsql:Enum:item_type", "show,movie,collection")
				.Annotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
				.Annotation("Npgsql:Enum:stream_type", "unknown,video,audio,subtitle,attachment")
				.OldAnnotation("Npgsql:Enum:item_type", "show,movie,collection")
				.OldAnnotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
				.OldAnnotation("Npgsql:Enum:stream_type", "unknown,video,audio,subtitle");
		}
	}
}
