using Microsoft.EntityFrameworkCore.Migrations;

namespace Kyoo.Postgresql.Migrations
{
	public partial class Triggers : Migration
	{
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE FUNCTION season_slug_update()
			RETURNS TRIGGER
			LANGUAGE PLPGSQL
			AS $$
			BEGIN
			    NEW.""Slug"" := CONCAT(
					(SELECT ""Slug"" FROM ""Shows"" WHERE ""ID"" = NEW.""ShowID""), 
					'-s',
					NEW.""SeasonNumber""
				);
				RETURN NEW;
			END
			$$;");
			
			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE TRIGGER season_slug_trigger BEFORE INSERT OR UPDATE OF ""SeasonNumber"", ""ShowID"" ON ""Seasons"" 
			FOR EACH ROW EXECUTE PROCEDURE season_slug_update();");


			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE FUNCTION show_slug_update()
			RETURNS TRIGGER
			LANGUAGE PLPGSQL
			AS $$
			BEGIN
				UPDATE ""Seasons"" SET ""Slug"" = CONCAT(new.""Slug"", '-s', ""SeasonNumber"") WHERE ""ShowID"" = NEW.""ID"";
				RETURN NEW;
			END
			$$;");
	        
			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE TRIGGER show_slug_trigger AFTER UPDATE OF ""Slug"" ON ""Shows""
			FOR EACH ROW EXECUTE PROCEDURE show_slug_update();");
		}

		protected override void Down(MigrationBuilder migrationBuilder)
		{
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP FUNCTION season_slug_update;");
			// language=PostgreSQL
			migrationBuilder.Sql("DROP TRIGGER show_slug_trigger ON \"Shows\";");
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP FUNCTION show_slug_update;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP TRIGGER season_slug_trigger;");
		}
	}
}