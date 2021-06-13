using Microsoft.EntityFrameworkCore.Migrations;

namespace Kyoo.SqLite.Migrations
{
    public partial class Triggers : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
	        migrationBuilder.Sql(@"
			CREATE TRIGGER SeasonSlugInsert AFTER INSERT ON Seasons FOR EACH ROW 
			BEGIN 
			    UPDATE Seasons SET Slug = (SELECT Slug from Shows WHERE ID = ShowID) || '-s' || SeasonNumber
				WHERE ID == new.ID;
			END");
	        migrationBuilder.Sql(@"
			CREATE TRIGGER SeasonSlugUpdate AFTER UPDATE OF SeasonNumber, ShowID ON Seasons FOR EACH ROW 
			BEGIN 
			    UPDATE Seasons SET Slug = (SELECT Slug from Shows WHERE ID = ShowID) || '-s' || SeasonNumber
				WHERE ID == new.ID;
			END");
	        migrationBuilder.Sql(@"
			CREATE TRIGGER ShowSlugUpdate AFTER UPDATE OF Slug ON Shows FOR EACH ROW
			BEGIN
			    UPDATE Seasons SET Slug = new.Slug || '-s' || SeasonNumber WHERE ShowID = new.ID;
			END;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
	        migrationBuilder.Sql("DROP TRIGGER SeasonSlugInsert;");
	        migrationBuilder.Sql("DROP TRIGGER SeasonSlugUpdate;");
	        migrationBuilder.Sql("DROP TRIGGER ShowSlugUpdate;");
        }
    }
}
