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

namespace Kyoo.Postgresql
{
	public static class MigrationHelper
	{
		public static void CreateLibraryItemsView(MigrationBuilder migrationBuilder)
		{
			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE VIEW library_items AS
			SELECT s.id, s.slug, s.title, s.overview, s.status, s.start_air, s.end_air, s.images, CASE
			WHEN s.is_movie THEN 'movie'::item_type
			ELSE 'show'::item_type
			END AS type
			FROM shows AS s
			WHERE NOT (EXISTS (
					SELECT 1
					FROM link_collection_show AS l
					INNER JOIN collections AS c ON l.collection_id = c.id
					WHERE s.id = l.show_id))
			UNION ALL
			SELECT -c0.id, c0.slug, c0.name AS title, c0.overview, 'unknown'::status AS status,
			NULL AS start_air, NULL AS end_air, c0.images, 'collection'::item_type AS type
			FROM collections AS c0");
		}

		public static void DropLibraryItemsView(MigrationBuilder migrationBuilder)
		{
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP VIEW library_items");
		}
	}
}
