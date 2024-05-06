using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kyoo.Postgresql.Migrations
{
	/// <inheritdoc />
	public partial class FixSeasonMetadataId : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			// language=PostgreSQL
			migrationBuilder.Sql(
				"""
				update seasons as s set external_id = (
					SELECT jsonb_build_object(
						'themoviedatabase', jsonb_build_object(
							'DataId', sh.external_id->'themoviedatabase'->'DataId',
							'Link', s.external_id->'themoviedatabase'->'Link'
						)
					)
					FROM shows AS sh
					WHERE sh.id = s.show_id
				);
				"""
			);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder) { }
	}
}
