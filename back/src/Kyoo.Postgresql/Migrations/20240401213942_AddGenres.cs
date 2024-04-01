using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kyoo.Postgresql.Migrations;

/// <inheritdoc />
public partial class AddGenres : Migration
{
	/// <inheritdoc />
	protected override void Up(MigrationBuilder migrationBuilder)
	{
		migrationBuilder
			.AlterDatabase()
			.Annotation(
				"Npgsql:Enum:genre",
				"action,adventure,animation,comedy,crime,documentary,drama,family,fantasy,history,horror,music,mystery,romance,science_fiction,thriller,war,western,kids,news,reality,soap,talk,politics"
			)
			.Annotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
			.Annotation("Npgsql:Enum:watch_status", "completed,watching,droped,planned,deleted")
			.OldAnnotation(
				"Npgsql:Enum:genre",
				"action,adventure,animation,comedy,crime,documentary,drama,family,fantasy,history,horror,music,mystery,romance,science_fiction,thriller,war,western"
			)
			.OldAnnotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
			.OldAnnotation(
				"Npgsql:Enum:watch_status",
				"completed,watching,droped,planned,deleted"
			);
	}

	/// <inheritdoc />
	protected override void Down(MigrationBuilder migrationBuilder)
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
				"action,adventure,animation,comedy,crime,documentary,drama,family,fantasy,history,horror,music,mystery,romance,science_fiction,thriller,war,western,kids,news,reality,soap,talk,politics"
			)
			.OldAnnotation("Npgsql:Enum:status", "unknown,finished,airing,planned")
			.OldAnnotation(
				"Npgsql:Enum:watch_status",
				"completed,watching,droped,planned,deleted"
			);
	}
}
