// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kyoo.Postgresql.Migrations
{
	/// <inheritdoc />
	public partial class News : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterDatabase()
				.Annotation("Npgsql:Enum:news_kind", "episode,movie");

			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE VIEW news AS
			SELECT
				e.id, e.slug, e.name, NULL AS tagline, '{}' AS aliases, e.path, e.overview, '{}' AS tags, '{}' AS genres,
				NULL AS status, e.release_date AS air_date, e.poster_source, e.poster_blurhash, e.thumbnail_source, e.thumbnail_blurhash,
				e.logo_source,e.logo_blurhash, NULL AS trailer, e.external_id, e.season_number, e.episode_number, e.absolute_number,
				'episode'::news_kind AS kind, e.added_date, s.id AS show_id, s.slug AS show_slug, s.name AS show_name,
				s.poster_source AS show_poster_source, s.poster_blurhash AS show_poster_blurhash, s.thumbnail_source AS show_thumbnail_source,
				s.thumbnail_blurhash AS show_thumbnail_blurhash, s.logo_source AS show_logo_source, s.logo_blurhash AS show_logo_blurhash
			FROM episodes AS e
			LEFT JOIN shows AS s ON e.show_id = s.id
			UNION ALL
			SELECT
				-m.id, m.slug, m.name, m.tagline, m.aliases, m.path, m.overview, m.tags, m.genres,
				m.status, m.air_date, m.poster_source, m.poster_blurhash, m.thumbnail_source, m.thumbnail_blurhash,
				m.logo_source, m.logo_blurhash, m.trailer, m.external_id, NULL AS season_number, NULL AS episode_number, NULL as absolute_number,
				'movie'::news_kind AS kind, m.added_date, NULL AS show_id, NULL AS show_slug, NULL AS show_name,
				NULL AS show_poster_source, NULL AS show_poster_blurhash, NULL AS show_thumbnail_source, NULL AS show_thumbnail_blurhash,
				NULL AS show_logo_source, NULL AS show_logo_blurhash
			FROM movies AS m
			");
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP VIEW news");
		}
	}
}
