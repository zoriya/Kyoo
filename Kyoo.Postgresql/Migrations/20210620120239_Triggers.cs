using Microsoft.EntityFrameworkCore.Migrations;

namespace Kyoo.Postgresql.Migrations
{
    public partial class Triggers : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
			migrationBuilder.Sql(@"
			CREATE FUNCTION season_slug_update()
			RETURNS TRIGGER
			LANGUAGE PLPGSQL
			AS $$
			BEGIN
			    NEW.""Slug"" := CONCAT(
					(SELECT ""Slug"" FROM ""Shows"" WHERE ""ID"" = NEW.""ShowID""), 
			        NEW.""ShowID"",
			        OLD.""SeasonNumber"",
			        NEW.""SeasonNumber"",
					'-s',
					NEW.""SeasonNumber""
				);
			    NEW.""Poster"" := 'NICE';
				RETURN NEW;
			END
			$$;");
			
			migrationBuilder.Sql(@"
			CREATE TRIGGER ""SeasonSlug"" BEFORE INSERT OR UPDATE OF ""SeasonNumber"", ""ShowID"" ON ""Seasons"" 
			FOR EACH ROW EXECUTE PROCEDURE season_slug_update();");


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
	        
	        migrationBuilder.Sql(@"
			CREATE TRIGGER ""ShowSlug"" AFTER UPDATE OF ""Slug"" ON ""Shows""
			FOR EACH ROW EXECUTE PROCEDURE show_slug_update();");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
	        migrationBuilder.Sql(@"DROP FUNCTION ""season_slug_update"";");
	        migrationBuilder.Sql(@"DROP TRIGGER ""SeasonSlug"";");
	        migrationBuilder.Sql(@"DROP FUNCTION ""show_slug_update"";");
	        migrationBuilder.Sql(@"DROP TRIGGER ""ShowSlug"";");
        }
    }
}
