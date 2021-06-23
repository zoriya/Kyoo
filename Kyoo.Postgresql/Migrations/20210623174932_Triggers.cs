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
			    NEW.slug := CONCAT(
					(SELECT slug FROM shows WHERE id = NEW.show_id), 
					'-s',
					NEW.season_number
				);
				RETURN NEW;
			END
			$$;");
			
			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE TRIGGER season_slug_trigger BEFORE INSERT OR UPDATE OF season_number, show_id ON seasons 
			FOR EACH ROW EXECUTE PROCEDURE season_slug_update();");


			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE FUNCTION show_slug_update()
			RETURNS TRIGGER
			LANGUAGE PLPGSQL
			AS $$
			BEGIN
				UPDATE seasons SET slug = CONCAT(NEW.slug, '-s', season_number) WHERE show_id = NEW.id;
				RETURN NEW;
			END
			$$;");
	        
			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE TRIGGER show_slug_trigger AFTER UPDATE OF slug ON shows
			FOR EACH ROW EXECUTE PROCEDURE show_slug_update();");
		}

		protected override void Down(MigrationBuilder migrationBuilder)
		{
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP FUNCTION season_slug_update;");
			// language=PostgreSQL
			migrationBuilder.Sql("DROP TRIGGER show_slug_trigger ON shows;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP FUNCTION show_slug_update;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP TRIGGER season_slug_trigger ON seasons;");
		}
	}
}