package src

import (
	"github.com/jmoiron/sqlx"
)

type MetadataService struct {
	database *sqlx.DB
}

func (s MetadataService) GetMetadata(path string, sha string) (*MediaInfo, error) {
	var ret MediaInfo
	rows, err := s.database.Queryx(`
		select * from info as i where i.sha=$1;
		select * from videos as v where v.sha=$1;
		select * from audios as a where a.sha=$1;
		select * from subtitles as s where s.sha=$1;
		select * from chapters as c where c.sha=$1;
		`,
		sha,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if !rows.Next() {
		if err = rows.Err(); err != nil {
			return nil, err
		}
		// TODO: retrieve mediainfo from file + store them in db.
		return &ret, nil
	}
	rows.StructScan(ret)

	rows.NextResultSet()
	for rows.Next() {
		var video Video
		rows.StructScan(video)
		ret.Videos = append(ret.Videos, video)
	}

	rows.NextResultSet()
	for rows.Next() {
		var audio Audio
		rows.StructScan(audio)
		ret.Audios = append(ret.Audios, audio)
	}

	rows.NextResultSet()
	for rows.Next() {
		var subtitle Subtitle
		rows.StructScan(subtitle)
		ret.Subtitles = append(ret.Subtitles, subtitle)
	}

	rows.NextResultSet()
	for rows.Next() {
		var chapter Chapter
		rows.StructScan(chapter)
		ret.Chapters = append(ret.Chapters, chapter)
	}

	return &ret, nil
}
