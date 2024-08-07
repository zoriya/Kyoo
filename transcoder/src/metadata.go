package src

import (
	"database/sql"
	"encoding/base64"
	"fmt"
	"net/url"
	"os"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/lib/pq"
	_ "github.com/lib/pq"
)

type MetadataService struct {
	database     *sql.DB
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
	db, err := sql.Open("postgres", con)
	if err != nil {
		return nil, err
	}

	_, err = db.Exec("create schema if not exists gocoder")
	if err != nil {
		return nil, err
	}

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return nil, err
	}
	m, err := migrate.NewWithDatabaseInstance("file://migrations", "postgres", driver)
	if err != nil {
		return nil, err
	}
	m.Up()

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
		tx, err := s.database.Begin()
		if err != nil {
			return nil, err
		}
		tx.Exec(`update videos set keyframes = nil where sha = $1`, sha)
		tx.Exec(`update audios set keyframes = nil where sha = $1`, sha)
		tx.Exec(`update info set ver_keyframes = 0 where sha = $1`, sha)
		err = tx.Commit()
		if err != nil {
			fmt.Printf("error deleteing old keyframes from database: %v", err)
		}
	}

	return ret, nil
}

func (s *MetadataService) getMetadata(path string, sha string) (*MediaInfo, error) {
	var ret MediaInfo
	var fonts pq.StringArray
	err := s.database.QueryRow(
		`select i.sha, i.path, i.extension, i.mime_codec, i.size, i.duration, i.container,
		i.fonts, i.ver_info, i.ver_extract, i.ver_thumbs, i.ver_keyframes
		from info as i where i.sha=$1`,
		sha,
	).Scan(
		&ret.Sha, &ret.Path, &ret.Extension, &ret.MimeCodec, &ret.Size, &ret.Duration, &ret.Container,
		&fonts, &ret.Versions.Info, &ret.Versions.Extract, &ret.Versions.Thumbs, &ret.Versions.Keyframes,
	)
	ret.Fonts = fonts

	if err == sql.ErrNoRows || (ret.Versions.Info < InfoVersion && ret.Versions.Info != 0) {
		return s.storeFreshMetadata(path, sha)
	}
	if err != nil {
		return nil, err
	}

	rows, err := s.database.Query(
		`select v.idx, v.title, v.language, v.codec, v.mime_codec, v.width, v.height, v.bitrate, v.keyframes
		from videos as v where v.sha=$1`,
		sha,
	)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var v Video
		err := rows.Scan(&v.Index, &v.Title, &v.Language, &v.Codec, &v.MimeCodec, &v.Width, &v.Height, &v.Bitrate, &v.Keyframes)
		if err != nil {
			return nil, err
		}
		v.Quality = QualityFromHeight(v.Height)
		ret.Videos = append(ret.Videos, v)
	}

	rows, err = s.database.Query(
		`select a.idx, a.title, a.language, a.codec, a.mime_codec, a.is_default, a.keyframes
		from audios as a where a.sha=$1`,
		sha,
	)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var a Audio
		err := rows.Scan(&a.Index, &a.Title, &a.Language, &a.Codec, &a.MimeCodec, &a.IsDefault, &a.Keyframes)
		if err != nil {
			return nil, err
		}
		ret.Audios = append(ret.Audios, a)
	}

	rows, err = s.database.Query(
		`select s.idx, s.title, s.language, s.codec, s.extension, s.is_default, s.is_forced, s.is_external, s.path
		from subtitles as s where s.sha=$1`,
		sha,
	)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var s Subtitle
		err := rows.Scan(&s.Index, &s.Title, &s.Language, &s.Codec, &s.Extension, &s.IsDefault, &s.IsForced, &s.IsExternal, &s.Path)
		if err != nil {
			return nil, err
		}
		if s.Extension != nil {
			link := fmt.Sprintf(
				"%s/%s/subtitle/%d.%s",
				Settings.RoutePrefix,
				base64.RawURLEncoding.EncodeToString([]byte(ret.Path)),
				s.Index,
				*s.Extension,
			)
			s.Link = &link
		}
		ret.Subtitles = append(ret.Subtitles, s)
	}

	rows, err = s.database.Query(
		`select c.start_time, c.end_time, c.name, c.type
		from chapters as c where c.sha=$1`,
		sha,
	)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var c Chapter
		err := rows.Scan(&c.StartTime, c.EndTime, c.Name, c.Type)
		if err != nil {
			return nil, err
		}
		ret.Chapters = append(ret.Chapters, c)
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

	tx, err := s.database.Begin()
	_, err = tx.Exec(
		`insert into info(sha, path, extension, mime_codec, size, duration, container,
		fonts, ver_info, ver_extract, ver_thumbs, ver_keyframes)
		values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		ret.Sha, ret.Path, ret.Extension, ret.MimeCodec, ret.Size, ret.Duration, ret.Container,
		pq.Array(ret.Fonts), ret.Versions.Info, ret.Versions.Extract, ret.Versions.Thumbs, ret.Versions.Keyframes,
	)
	for _, v := range ret.Videos {
		tx.Exec(
			`insert into videos(sha, idx, title, language, codec, mime_codec, width, height, bitrate)
			values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			ret.Sha, v.Index, v.Title, v.Language, v.Codec, v.MimeCodec, v.Width, v.Height, v.Bitrate,
		)
	}
	for _, a := range ret.Audios {
		tx.Exec(
			`insert into audios(sha, idx, title, language, codec, mime_codec, is_default)
			values ($1, $2, $3, $4, $5, $6, $7)`,
			ret.Sha, a.Index, a.Title, a.Language, a.Codec, a.MimeCodec, a.IsDefault,
		)
	}
	for _, s := range ret.Subtitles {
		tx.Exec(
			`insert into subtitles(sha, idx, title, language, codec, extension, is_default, is_forced, is_external, path)
			values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
			ret.Sha, s.Index, s.Title, s.Language, s.Codec, s.Extension, s.IsDefault, s.IsForced, s.IsExternal, s.Path,
		)
	}
	for _, c := range ret.Chapters {
		tx.Exec(
			`insert into chapters(sha, start_time, end_time, name, type)
			values ($1, $2, $3, $4, $5)`,
			ret.Sha, c.StartTime, c.EndTime, c.Name, c.Type,
		)
	}
	err = tx.Commit()
	if err != nil {
		return set(ret, err)
	}

	return set(ret, nil)
}
