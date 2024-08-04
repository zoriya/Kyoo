package src

import (
	"fmt"
	"net/url"
	"os"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

type MetadataService struct {
	database     *sqlx.DB
	lock         RunLock[string, *MediaInfo]
	thumbLock    RunLock[string, interface{}]
	extractLock  RunLock[string, interface{}]
	keyframeLock RunLock[KeyframeKey, *Keyframe]
}

func NewMetadataService() (*MetadataService, error) {
	con := fmt.Sprintf(
		"postgresql://%v:%v@%v:%v/%v?application_name=gocoder&search_path=gocoder&sslmode=disable",
		url.QueryEscape(os.Getenv("POSTGRES_USER")),
		url.QueryEscape(os.Getenv("POSTGRES_PASSWORD")),
		url.QueryEscape(os.Getenv("POSTGRES_SERVER")),
		url.QueryEscape(os.Getenv("POSTGRES_PORT")),
		url.QueryEscape(os.Getenv("POSTGRES_DB")),
	)
	db, err := sqlx.Open("postgres", con)
	if err != nil {
		return nil, err
	}

	db.MustExec("create schema if not exists gocoder")

	driver, err := postgres.WithInstance(db.DB, &postgres.Config{})
	if err != nil {
		return nil, err
	}
	m, err := migrate.NewWithDatabaseInstance("file://./migrations", "postgres", driver)
	if err != nil {
		return nil, err
	}
	err = m.Up()
	if err != nil {
		return nil, err
	}

	return &MetadataService{
		database:     db,
		lock:         NewRunLock[string, *MediaInfo](),
		thumbLock:    NewRunLock[string, interface{}](),
		extractLock:  NewRunLock[string, interface{}](),
		keyframeLock: NewRunLock[KeyframeKey, *Keyframe](),
	}, nil
}

func (s *MetadataService) GetMetadata(path string, sha string) (*MediaInfo, error) {
	ret, err := s.getMetadata(path, sha)
	if err != nil {
		return nil, err
	}

	if ret.Versions.Thumbs < ThumbsVersion {
		go s.ExtractThumbs(path, sha)
	}
	if ret.Versions.Extract < ExtractVersion {
		go s.ExtractSubs(ret)
	}
	if ret.Versions.Keyframes < KeyframeVersion && ret.Versions.Keyframes != 0 {
		for _, video := range ret.Videos {
			video.Keyframes = nil
		}
		for _, audio := range ret.Audios {
			audio.Keyframes = nil
		}
		s.database.NamedExec(`
			update videos set keyframes = nil where sha = :sha;
			update audios set keyframes = nil where sha = :sha;
			update info set ver_keyframes = 0 where sha = :sha;
			`,
			map[string]interface{}{
				"sha": sha,
			},
		)
	}

	return ret, nil
}

func (s *MetadataService) getMetadata(path string, sha string) (*MediaInfo, error) {
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
		return s.storeFreshMetadata(path, sha)
	}
	rows.StructScan(ret)

	if ret.Versions.Info != InfoVersion {
		return s.storeFreshMetadata(path, sha)
	}

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

func (s *MetadataService) storeFreshMetadata(path string, sha string) (*MediaInfo, error) {
	get_running, set := s.lock.Start(sha)
	if get_running != nil {
		return get_running()
	}

	ret, err := RetriveMediaInfo(path, sha)
	if err != nil {
		return set(nil, err)
	}

	tx := s.database.MustBegin()
	tx.NamedExec(
		`insert into info(sha, path, extension, mime_codec, size, duration, container, fonts, ver_info)
		values (:sha, :path, :extension, :mime_codec, :size, :duration, :container, :fonts, :ver_info)`,
		ret,
	)
	for _, video := range ret.Videos {
		tx.NamedExec(
			`insert into videos(sha, idx, title, language, codec, mime_codec, width, height, bitrate)
			values (:sha, :idx, :title, :language, :codec, :mime_codec, :width, :height, :bitrate)`,
			video,
		)
	}
	for _, audio := range ret.Audios {
		tx.NamedExec(
			`insert into audios(sha, idx, title, language, codec, mime_codec, is_default)
			values (:sha, :idx, :title, :language, :codec, :mime_codec, :is_default)`,
			audio,
		)
	}
	for _, subtitle := range ret.Subtitles {
		tx.NamedExec(
			`insert into subtitles(sha, idx, title, language, codec, extension, is_default, is_forced, is_external, path)
			values (:sha, :idx, :title, :language, :codec, :extension, :is_default, :is_forced, :is_external, :path)`,
			subtitle,
		)
	}
	for _, chapter := range ret.Chapters {
		tx.NamedExec(
			`insert into chapters(sha, start_time, end_time, name, type)
			values (:sha, :start_time, :end_time, :name, :type)`,
			chapter,
		)
	}
	err = tx.Commit()
	if err != nil {
		return set(ret, err)
	}

	return set(ret, nil)
}
