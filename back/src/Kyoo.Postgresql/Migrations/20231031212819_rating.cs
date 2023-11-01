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
	public partial class Rating : Items
	{
		public static void CreateItemView(MigrationBuilder migrationBuilder)
		{
			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE VIEW library_items AS
			SELECT
				s.id, s.slug, s.name, s.tagline, s.aliases, s.overview, s.tags, s.genres, s.status,
				s.start_air, s.end_air, s.poster_source, s.poster_blurhash, s.thumbnail_source, s.thumbnail_blurhash,
				s.logo_source, s.logo_blurhash, s.trailer, s.external_id, s.start_air AS air_date, NULL as path,
				'show'::item_kind AS kind, s.added_date, s.rating, NULL AS runtime
			FROM shows AS s
			UNION ALL
			SELECT
				-m.id, m.slug, m.name, m.tagline, m.aliases, m.overview, m.tags, m.genres, m.status,
				m.air_date as start_air, m.air_date as end_air, m.poster_source, m.poster_blurhash, m.thumbnail_source,
				m.thumbnail_blurhash, m.logo_source, m.logo_blurhash, m.trailer, m.external_id, m.air_date, m.path,
				'movie'::item_kind AS kind, m.added_date, m.rating, m.runtime
			FROM movies AS m
			UNION ALL
			SELECT
				c.id + 10000 AS id, c.slug, c.name, NULL as tagline, '{}' as alises, c.overview, '{}' AS tags, '{}' AS genres, 'unknown'::status AS status,
				NULL AS start_air, NULL AS end_air, c.poster_source, c.poster_blurhash, c.thumbnail_source,
				c.thumbnail_blurhash, c.logo_source, c.logo_blurhash, NULL as trailer, c.external_id, NULL AS air_date, NULL as path,
				'collection'::item_kind AS kind, c.added_date, 0 AS rating, NULL AS runtime
			FROM collections AS c
			");

			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE VIEW news AS
			SELECT
				e.id, e.slug, e.name, NULL AS tagline, '{}' AS aliases, e.path, e.overview, '{}' AS tags, '{}' AS genres,
				NULL AS status, e.release_date AS air_date, e.poster_source, e.poster_blurhash, e.thumbnail_source, e.thumbnail_blurhash,
				e.logo_source,e.logo_blurhash, NULL AS trailer, e.external_id, e.season_number, e.episode_number, e.absolute_number,
				'episode'::news_kind AS kind, e.added_date, s.id AS show_id, s.slug AS show_slug, s.name AS show_name,
				s.poster_source AS show_poster_source, s.poster_blurhash AS show_poster_blurhash, s.thumbnail_source AS show_thumbnail_source,
				s.thumbnail_blurhash AS show_thumbnail_blurhash, s.logo_source AS show_logo_source, s.logo_blurhash AS show_logo_blurhash,
				NULL as rating, e.runtime
			FROM episodes AS e
			LEFT JOIN shows AS s ON e.show_id = s.id
			UNION ALL
			SELECT
				-m.id, m.slug, m.name, m.tagline, m.aliases, m.path, m.overview, m.tags, m.genres,
				m.status, m.air_date, m.poster_source, m.poster_blurhash, m.thumbnail_source, m.thumbnail_blurhash,
				m.logo_source, m.logo_blurhash, m.trailer, m.external_id, NULL AS season_number, NULL AS episode_number, NULL as absolute_number,
				'movie'::news_kind AS kind, m.added_date, NULL AS show_id, NULL AS show_slug, NULL AS show_name,
				NULL AS show_poster_source, NULL AS show_poster_blurhash, NULL AS show_thumbnail_source, NULL AS show_thumbnail_blurhash,
				NULL AS show_logo_source, NULL AS show_logo_blurhash, m.rating, m.runtime
			FROM movies AS m
			");
		}

		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			base.Down(migrationBuilder);
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP VIEW news");

			migrationBuilder.AddColumn<int>(
				name: "rating",
				table: "shows",
				type: "integer",
				nullable: false);

			migrationBuilder.AddColumn<int>(
				name: "rating",
				table: "movies",
				type: "integer",
				nullable: false);

			migrationBuilder.AddColumn<int>(
				name: "runtime",
				table: "movies",
				type: "integer",
				nullable: false,
				defaultValue: 0);

			migrationBuilder.AddColumn<int>(
				name: "runtime",
				table: "episodes",
				type: "integer",
				nullable: false,
				defaultValue: 0);

			CreateItemView(migrationBuilder);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			base.Down(migrationBuilder);
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP VIEW news");

			migrationBuilder.DropColumn(
				name: "rating",
				table: "shows");

			migrationBuilder.DropColumn(
				name: "rating",
				table: "movies");

			migrationBuilder.DropColumn(
				name: "runtime",
				table: "movies");

			migrationBuilder.DropColumn(
				name: "runtime",
				table: "episodes");

			AddedDate.CreateItemView(migrationBuilder);
		}
	}
}
