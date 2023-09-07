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

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kyoo.Postgresql.Migrations
{
	/// <inheritdoc />
	public partial class AddedDate : Items
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
				'show'::item_kind AS kind, added_date
			FROM shows AS s
			UNION ALL
			SELECT
				-m.id, m.slug, m.name, m.tagline, m.aliases, m.overview, m.tags, m.genres, m.status,
				m.air_date as start_air, m.air_date as end_air, m.poster_source, m.poster_blurhash, m.thumbnail_source,
				m.thumbnail_blurhash, m.logo_source, m.logo_blurhash, m.trailer, m.external_id, m.air_date, m.path,
				'movie'::item_kind AS kind, added_date
			FROM movies AS m
			UNION ALL
			SELECT
				c.id + 10000 AS id, c.slug, c.name, NULL as tagline, NULL as alises, c.overview, NULL AS tags, NULL AS genres, 'unknown'::status AS status,
				NULL AS start_air, NULL AS end_air, c.poster_source, c.poster_blurhash, c.thumbnail_source,
				c.thumbnail_blurhash, c.logo_source, c.logo_blurhash, NULL as trailer, c.external_id, NULL AS air_date, NULL as path,
				'collection'::item_kind AS kind, added_date
			FROM collections AS c
			");
		}

		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			base.Down(migrationBuilder);

			migrationBuilder.AddColumn<DateTime>(
				name: "added_date",
				table: "users",
				type: "timestamp with time zone",
				nullable: false,
				defaultValueSql: "now() at time zone 'utc'");

			migrationBuilder.AddColumn<DateTime>(
				name: "added_date",
				table: "shows",
				type: "timestamp with time zone",
				nullable: false,
				defaultValueSql: "now() at time zone 'utc'");

			migrationBuilder.AddColumn<DateTime>(
				name: "added_date",
				table: "seasons",
				type: "timestamp with time zone",
				nullable: false,
				defaultValueSql: "now() at time zone 'utc'");

			migrationBuilder.AddColumn<DateTime>(
				name: "added_date",
				table: "movies",
				type: "timestamp with time zone",
				nullable: false,
				defaultValueSql: "now() at time zone 'utc'");

			migrationBuilder.AddColumn<DateTime>(
				name: "added_date",
				table: "episodes",
				type: "timestamp with time zone",
				nullable: false,
				defaultValueSql: "now() at time zone 'utc'");

			migrationBuilder.AddColumn<DateTime>(
				name: "added_date",
				table: "collections",
				type: "timestamp with time zone",
				nullable: false,
				defaultValueSql: "now() at time zone 'utc'");

			CreateItemView(migrationBuilder);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			base.Down(migrationBuilder);

			migrationBuilder.DropColumn(
				name: "added_date",
				table: "users");

			migrationBuilder.DropColumn(
				name: "added_date",
				table: "shows");

			migrationBuilder.DropColumn(
				name: "added_date",
				table: "seasons");

			migrationBuilder.DropColumn(
				name: "added_date",
				table: "movies");

			migrationBuilder.DropColumn(
				name: "added_date",
				table: "episodes");

			migrationBuilder.DropColumn(
				name: "added_date",
				table: "collections");

			base.Up(migrationBuilder);
		}
	}
}
