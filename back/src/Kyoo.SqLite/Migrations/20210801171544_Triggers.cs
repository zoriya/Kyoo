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

namespace Kyoo.SqLite.Migrations
{
	/// <summary>
	/// A migration that adds sqlite triggers to update slugs.
	/// </summary>
	public partial class Triggers : Migration
	{
		/// <inheritdoc/>
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			// language=SQLite
			migrationBuilder.Sql(@"
			CREATE TRIGGER SeasonSlugInsert AFTER INSERT ON Seasons FOR EACH ROW
			BEGIN
			    UPDATE Seasons SET Slug = (SELECT Slug from Shows WHERE ID = ShowID) || '-s' || SeasonNumber
				WHERE ID == new.ID;
			END");
			// language=SQLite
			migrationBuilder.Sql(@"
			CREATE TRIGGER SeasonSlugUpdate AFTER UPDATE OF SeasonNumber, ShowID ON Seasons FOR EACH ROW
			BEGIN
			    UPDATE Seasons SET Slug = (SELECT Slug from Shows WHERE ID = ShowID) || '-s' || SeasonNumber
				WHERE ID == new.ID;
			END");

			// language=SQLite
			migrationBuilder.Sql(@"
			CREATE TRIGGER EpisodeSlugInsert AFTER INSERT ON Episodes FOR EACH ROW
			BEGIN
				UPDATE Episodes
					SET Slug = (SELECT Slug from Shows WHERE ID = ShowID) ||
					           CASE
						           WHEN SeasonNumber IS NULL AND AbsoluteNumber IS NULL THEN ''
						           WHEN SeasonNumber IS NULL THEN '-' || AbsoluteNumber
						           ELSE '-s' || SeasonNumber || 'e' || EpisodeNumber
					           END
				WHERE ID == new.ID;
			END");
			// language=SQLite
			migrationBuilder.Sql(@"
			CREATE TRIGGER EpisodeSlugUpdate AFTER UPDATE OF AbsoluteNumber, EpisodeNumber, SeasonNumber, ShowID
			    ON Episodes FOR EACH ROW
			BEGIN
				UPDATE Episodes
					SET Slug = (SELECT Slug from Shows WHERE ID = ShowID) ||
					           CASE
						           WHEN SeasonNumber IS NULL AND AbsoluteNumber IS NULL THEN ''
						           WHEN SeasonNumber IS NULL THEN '-' || AbsoluteNumber
						           ELSE '-s' || SeasonNumber || 'e' || EpisodeNumber
					           END
				WHERE ID == new.ID;
			END");

			// language=SQLite
			migrationBuilder.Sql(@"
			CREATE TRIGGER TrackSlugInsert
			AFTER INSERT ON Tracks
			FOR EACH ROW
			BEGIN
				UPDATE Tracks SET TrackIndex = (
						SELECT COUNT(*) FROM Tracks
						WHERE EpisodeID = new.EpisodeID AND Type = new.Type
						  AND Language = new.Language AND IsForced = new.IsForced
					) WHERE ID = new.ID AND TrackIndex = 0;
				UPDATE Tracks SET Slug = (SELECT Slug FROM Episodes WHERE ID = EpisodeID) ||
						'.' || COALESCE(Language, 'und') ||
						CASE (TrackIndex)
							WHEN 0 THEN ''
							ELSE '-' || (TrackIndex)
						END ||
						CASE (IsForced)
							WHEN false THEN ''
							ELSE '.forced'
						END ||
						CASE (Type)
							WHEN 1 THEN '.video'
							WHEN 2 THEN '.audio'
							WHEN 3 THEN '.subtitle'
							ELSE '.' || Type
						END
					WHERE ID = new.ID;
			END;");
			// language=SQLite
			migrationBuilder.Sql(@"
			CREATE TRIGGER TrackSlugUpdate
			AFTER UPDATE OF EpisodeID, IsForced, Language, TrackIndex, Type ON Tracks
			FOR EACH ROW
			BEGIN
				UPDATE Tracks SET TrackIndex = (
						SELECT COUNT(*) FROM Tracks
						WHERE EpisodeID = new.EpisodeID AND Type = new.Type
						  AND Language = new.Language AND IsForced = new.IsForced
					) WHERE ID = new.ID AND TrackIndex = 0;
				UPDATE Tracks SET Slug =
					    (SELECT Slug FROM Episodes WHERE ID = EpisodeID) ||
						'.' || Language ||
						CASE (TrackIndex)
							WHEN 0 THEN ''
							ELSE '-' || (TrackIndex)
						END ||
						CASE (IsForced)
							WHEN false THEN ''
							ELSE '.forced'
						END ||
						CASE (Type)
							WHEN 1 THEN '.video'
							WHEN 2 THEN '.audio'
							WHEN 3 THEN '.subtitle'
							ELSE '.' || Type
						END
					WHERE ID = new.ID;
			END;");
			// language=SQLite
			migrationBuilder.Sql(@"
			CREATE TRIGGER EpisodeUpdateTracksSlug
			AFTER UPDATE OF Slug ON Episodes
			FOR EACH ROW
			BEGIN
				UPDATE Tracks SET Slug =
						NEW.Slug ||
						'.' || Language ||
						CASE (TrackIndex)
							WHEN 0 THEN ''
							ELSE '-' || TrackIndex
						END ||
						CASE (IsForced)
							WHEN false THEN ''
							ELSE '.forced'
						END ||
						CASE (Type)
							WHEN 1 THEN '.video'
							WHEN 2 THEN '.audio'
							WHEN 3 THEN '.subtitle'
							ELSE '.' || Type
						END
					WHERE EpisodeID = NEW.ID;
			END;");

			// language=SQLite
			migrationBuilder.Sql(@"
			CREATE TRIGGER ShowSlugUpdate AFTER UPDATE OF Slug ON Shows FOR EACH ROW
			BEGIN
				UPDATE Seasons SET Slug = new.Slug || '-s' || SeasonNumber WHERE ShowID = new.ID;
				UPDATE Episodes
					SET Slug = new.Slug ||
					           CASE
					               WHEN SeasonNumber IS NULL AND AbsoluteNumber IS NULL THEN ''
					               WHEN SeasonNumber IS NULL THEN '-' || AbsoluteNumber
					               ELSE '-s' || SeasonNumber || 'e' || EpisodeNumber
					           END
				WHERE ShowID = new.ID;
			END;");

			// language=SQLite
			migrationBuilder.Sql(@"
			CREATE VIEW LibraryItems AS
				SELECT s.ID, s.Slug, s.Title, s.Overview, s.Status, s.StartAir, s.EndAir, s.Images, CASE
					WHEN s.IsMovie THEN 1
					ELSE 0
					END AS Type
				FROM Shows AS s
				WHERE NOT (EXISTS (
					SELECT 1
					FROM LinkCollectionShow AS l
					INNER JOIN Collections AS c ON l.CollectionID = c.ID
					WHERE s.ID = l.ShowID))
				UNION ALL
				SELECT -c0.ID, c0.Slug, c0.Name AS Title, c0.Overview, 0 AS Status,
				       NULL AS StartAir, NULL AS EndAir, c0.Images, 2 AS Type
				FROM collections AS c0");
		}

		/// <inheritdoc/>
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			// language=SQLite
			migrationBuilder.Sql("DROP TRIGGER SeasonSlugInsert;");
			// language=SQLite
			migrationBuilder.Sql("DROP TRIGGER SeasonSlugUpdate;");
			// language=SQLite
			migrationBuilder.Sql("DROP TRIGGER EpisodeSlugInsert;");
			// language=SQLite
			migrationBuilder.Sql("DROP TRIGGER EpisodeSlugUpdate;");
			// language=SQLite
			migrationBuilder.Sql("DROP TRIGGER ShowSlugUpdate;");
		}
	}
}
