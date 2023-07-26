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

namespace Kyoo.Postgresql.Migrations
{
	/// <summary>
	/// A migration that adds postgres triggers to update slugs.
	/// </summary>
	public partial class Triggers : Migration
	{
		/// <inheritdoc/>
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
			CREATE FUNCTION episode_slug_update()
			RETURNS TRIGGER
			LANGUAGE PLPGSQL
			AS $$
			BEGIN
				NEW.slug := CONCAT(
					(SELECT slug FROM shows WHERE id = NEW.show_id),
					CASE
						WHEN NEW.season_number IS NULL AND NEW.episode_number IS NULL THEN NULL
						WHEN NEW.season_number IS NULL THEN CONCAT('-', NEW.absolute_number)
						ELSE CONCAT('-s', NEW.season_number, 'e', NEW.episode_number)
					END
				);
				RETURN NEW;
			END
			$$;");

			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE TRIGGER episode_slug_trigger
			BEFORE INSERT OR UPDATE OF absolute_number, episode_number, season_number, show_id ON episodes
			FOR EACH ROW EXECUTE PROCEDURE episode_slug_update();");

			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE FUNCTION show_slug_update()
			RETURNS TRIGGER
			LANGUAGE PLPGSQL
			AS $$
			BEGIN
				UPDATE seasons SET slug = CONCAT(NEW.slug, '-s', season_number) WHERE show_id = NEW.id;
				UPDATE episodes SET slug = CASE
					WHEN season_number IS NULL AND episode_number IS NULL THEN NEW.slug
					WHEN season_number IS NULL THEN CONCAT(NEW.slug, '-', absolute_number)
					ELSE CONCAT(NEW.slug, '-s', season_number, 'e', episode_number)
				END WHERE show_id = NEW.id;
				RETURN NEW;
			END
			$$;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE TRIGGER show_slug_trigger AFTER UPDATE OF slug ON shows
			FOR EACH ROW EXECUTE PROCEDURE show_slug_update();");

			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE FUNCTION episode_update_tracks_slug()
			RETURNS TRIGGER
			LANGUAGE PLPGSQL
			AS $$
			BEGIN
				UPDATE tracks SET slug = CONCAT(
					NEW.slug,
					'.', language,
					CASE (track_index)
						WHEN 0 THEN ''
						ELSE CONCAT('-', track_index)
					END,
					CASE (is_forced)
						WHEN false THEN ''
						ELSE '.forced'
					END,
					'.', type
				) WHERE episode_id = NEW.id;
				RETURN NEW;
			END;
			$$;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE TRIGGER episode_track_slug_trigger AFTER UPDATE OF slug ON episodes
			FOR EACH ROW EXECUTE PROCEDURE episode_update_tracks_slug();");

			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE FUNCTION track_slug_update()
			RETURNS TRIGGER
			LANGUAGE PLPGSQL
			AS $$
			BEGIN
				IF NEW.track_index = 0 THEN
					NEW.track_index := (SELECT COUNT(*) FROM tracks
						WHERE episode_id = NEW.episode_id AND type = NEW.type
						  AND language = NEW.language AND is_forced = NEW.is_forced);
				END IF;
				NEW.slug := CONCAT(
					(SELECT slug FROM episodes WHERE id = NEW.episode_id),
					'.', COALESCE(NEW.language, 'und'),
					CASE (NEW.track_index)
						WHEN 0 THEN ''
						ELSE CONCAT('-', NEW.track_index)
					END,
					CASE (NEW.is_forced)
						WHEN false THEN ''
						ELSE '.forced'
					END,
					'.', NEW.type
				);
				RETURN NEW;
			END
			$$;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"
			CREATE TRIGGER track_slug_trigger
			BEFORE INSERT OR UPDATE OF episode_id, is_forced, language, track_index, type ON tracks
			FOR EACH ROW EXECUTE PROCEDURE track_slug_update();");

			MigrationHelper.CreateLibraryItemsView(migrationBuilder);
		}

		/// <inheritdoc/>
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			// language=PostgreSQL
			migrationBuilder.Sql("DROP TRIGGER show_slug_trigger ON shows;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP FUNCTION show_slug_update;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP TRIGGER season_slug_trigger ON seasons;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP FUNCTION season_slug_update;");
			// language=PostgreSQL
			migrationBuilder.Sql("DROP TRIGGER episode_slug_trigger ON episodes;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP FUNCTION episode_slug_update;");
			// language=PostgreSQL
			migrationBuilder.Sql("DROP TRIGGER track_slug_trigger ON tracks;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP FUNCTION track_slug_update;");
			// language=PostgreSQL
			migrationBuilder.Sql("DROP TRIGGER episode_track_slug_trigger ON episodes;");
			// language=PostgreSQL
			migrationBuilder.Sql(@"DROP FUNCTION episode_update_tracks_slug;");
			MigrationHelper.DropLibraryItemsView(migrationBuilder);
		}
	}
}
