package src

import (
	"context"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	"net/url"
	"os"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/lib/pq"
	"github.com/zoriya/kyoo/transcoder/src/storage"
)

type MetadataService struct {
	database     *sql.DB
	lock         RunLock[string, *MediaInfo]
	thumbLock    RunLock[string, interface{}]
	extractLock  RunLock[string, interface{}]
	keyframeLock RunLock[KeyframeKey, *Keyframe]
	storage      storage.StorageBackend
}

func NewMetadataService() (*MetadataService, error) {
	ctx := context.TODO()

	s := &MetadataService{
		lock:         NewRunLock[string, *MediaInfo](),
		thumbLock:    NewRunLock[string, interface{}](),
		extractLock:  NewRunLock[string, interface{}](),
		keyframeLock: NewRunLock[KeyframeKey, *Keyframe](),
	}

	db, err := s.setupDb()
	if err != nil {
		return nil, fmt.Errorf("failed to setup database: %w", err)
	}
	s.database = db

	storage, err := s.setupStorage(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to setup storage: %w", err)
	}
	s.storage = storage

	return s, nil
}

func (s *MetadataService) Close() error {
	cleanupErrs := make([]error, 0, 2)
	if s.database != nil {
		err := s.database.Close()
		if err != nil {
			cleanupErrs = append(cleanupErrs, fmt.Errorf("failed to close database: %w", err))
		}
	}

	if s.storage != nil {
		if storageCloser, ok := s.storage.(storage.StorageBackendCloser); ok {
			err := storageCloser.Close()
			if err != nil {
				cleanupErrs = append(cleanupErrs, fmt.Errorf("failed to close storage: %w", err))
			}
		}
	}

	if err := errors.Join(cleanupErrs...); err != nil {
		return fmt.Errorf("failed to cleanup resources: %w", err)
	}

	return nil
}

func (s *MetadataService) setupDb() (*sql.DB, error) {
	schema := GetEnvOr("POSTGRES_SCHEMA", "gocoder")

	connectionString := os.Getenv("POSTGRES_URL")
	if connectionString == "" {
		connectionString = fmt.Sprintf(
			"postgresql://%v:%v@%v:%v/%v?application_name=gocoder&sslmode=%s",
			url.QueryEscape(os.Getenv("POSTGRES_USER")),
			url.QueryEscape(os.Getenv("POSTGRES_PASSWORD")),
			url.QueryEscape(os.Getenv("POSTGRES_SERVER")),
			url.QueryEscape(os.Getenv("POSTGRES_PORT")),
			url.QueryEscape(os.Getenv("POSTGRES_DB")),
			url.QueryEscape(GetEnvOr("POSTGRES_SSLMODE", "disable")),
		)
		if schema != "disabled" {
			connectionString = fmt.Sprintf("%s&search_path=%s", connectionString, url.QueryEscape(schema))
		}
	}

	db, err := sql.Open("postgres", connectionString)
	if err != nil {
		fmt.Printf("Could not connect to database, check your env variables!")
		return nil, err
	}

	if schema != "disabled" {
		_, err = db.Exec(fmt.Sprintf("create schema if not exists %s", schema))
		if err != nil {
			return nil, err
		}
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

	return db, nil
}

func (s *MetadataService) setupStorage(ctx context.Context) (storage.StorageBackend, error) {
	s3BucketName := os.Getenv("S3_BUCKET_NAME")
	if s3BucketName != "" {
		// Use S3 storage
		// Create the client (use all standard AWS config sources like env vars, config files, etc.)
		awsConfig, err := config.LoadDefaultConfig(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to load AWS config: %w", err)
		}
		s3Client := s3.NewFromConfig(awsConfig)

		return storage.NewS3StorageBackend(s3Client, s3BucketName), nil
	}

	// Use local file storage
	storageRoot := GetEnvOr("GOCODER_METADATA_ROOT", "/metadata")

	localStorage, err := storage.NewFileStorageBackend(storageRoot)
	if err != nil {
		return nil, fmt.Errorf("failed to create local storage backend: %w", err)
	}
	return localStorage, nil
}

func (s *MetadataService) GetMetadata(ctx context.Context, path string, sha string) (*MediaInfo, error) {
	ret, err := s.getMetadata(path, sha)
	if err != nil {
		return nil, err
	}

	if ret.Versions.Thumbs < ThumbsVersion {
		go s.ExtractThumbs(ctx, path, sha)
	}
	if ret.Versions.Extract < ExtractVersion {
		go s.ExtractSubs(ctx, ret)
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
		tx.Exec(`update videos set keyframes = null where sha = $1`, sha)
		tx.Exec(`update audios set keyframes = null where sha = $1`, sha)
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
	ret.Videos = make([]Video, 0)
	ret.Audios = make([]Audio, 0)
	ret.Subtitles = make([]Subtitle, 0)
	ret.Chapters = make([]Chapter, 0)

	if err == sql.ErrNoRows || (ret.Versions.Info < InfoVersion && ret.Versions.Info != 0) {
		return s.storeFreshMetadata(path, sha)
	}
	if err != nil {
		return nil, err
	}

	rows, err := s.database.Query(
		`select v.idx, v.title, v.language, v.codec, v.mime_codec, v.width, v.height, v.bitrate, v.is_default, v.keyframes
		from videos as v where v.sha=$1`,
		sha,
	)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var v Video
		err := rows.Scan(&v.Index, &v.Title, &v.Language, &v.Codec, &v.MimeCodec, &v.Width, &v.Height, &v.Bitrate, &v.IsDefault, &v.Keyframes)
		if err != nil {
			return nil, err
		}
		ret.Videos = append(ret.Videos, v)
	}

	rows, err = s.database.Query(
		`select a.idx, a.title, a.language, a.codec, a.mime_codec, a.bitrate, a.is_default, a.keyframes
		from audios as a where a.sha=$1`,
		sha,
	)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var a Audio
		err := rows.Scan(&a.Index, &a.Title, &a.Language, &a.Codec, &a.MimeCodec, &a.Bitrate, &a.IsDefault, &a.Keyframes)
		if err != nil {
			return nil, err
		}
		ret.Audios = append(ret.Audios, a)
	}

	rows, err = s.database.Query(
		`select s.idx, s.title, s.language, s.codec, s.extension, s.is_default, s.is_forced, s.is_hearing_impaired
		from subtitles as s where s.sha=$1`,
		sha,
	)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var s Subtitle
		err := rows.Scan(&s.Index, &s.Title, &s.Language, &s.Codec, &s.Extension, &s.IsDefault, &s.IsForced, &s.IsHearingImpaired)
		if err != nil {
			return nil, err
		}
		if s.Extension != nil {
			link := fmt.Sprintf(
				"video/%s/subtitle/%d.%s",
				base64.RawURLEncoding.EncodeToString([]byte(ret.Path)),
				*s.Index,
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
		err := rows.Scan(&c.StartTime, &c.EndTime, &c.Name, &c.Type)
		if err != nil {
			return nil, err
		}
		ret.Chapters = append(ret.Chapters, c)
	}

	if len(ret.Videos) > 0 {
		ret.Video = ret.Videos[0]
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
	if err != nil {
		return set(ret, err)
	}

	// it needs to be a delete instead of a on conflict do update because we want to trigger delete casquade for
	// videos/audios & co.
	tx.Exec(`delete from info where path = $1`, path)
	tx.Exec(`
		insert into info(sha, path, extension, mime_codec, size, duration, container,
		fonts, ver_info, ver_extract, ver_thumbs, ver_keyframes)
		values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		`,
		// on conflict do not update versions of extract/thumbs/keyframes
		ret.Sha, ret.Path, ret.Extension, ret.MimeCodec, ret.Size, ret.Duration, ret.Container,
		pq.Array(ret.Fonts), ret.Versions.Info, ret.Versions.Extract, ret.Versions.Thumbs, ret.Versions.Keyframes,
	)
	for _, v := range ret.Videos {
		tx.Exec(`
			insert into videos(sha, idx, title, language, codec, mime_codec, width, height, is_default, bitrate)
			values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			on conflict (sha, idx) do update set
				sha = excluded.sha,
				idx = excluded.idx,
				title = excluded.title,
				language = excluded.language,
				codec = excluded.codec,
				mime_codec = excluded.mime_codec,
				width = excluded.width,
				height = excluded.height,
				is_default = excluded.is_default,
				bitrate = excluded.bitrate
			`,
			ret.Sha, v.Index, v.Title, v.Language, v.Codec, v.MimeCodec, v.Width, v.Height, v.IsDefault, v.Bitrate,
		)
	}
	for _, a := range ret.Audios {
		tx.Exec(`
			insert into audios(sha, idx, title, language, codec, mime_codec, is_default, bitrate)
			values ($1, $2, $3, $4, $5, $6, $7, $8)
			on conflict (sha, idx) do update set
				sha = excluded.sha,
				idx = excluded.idx,
				title = excluded.title,
				language = excluded.language,
				codec = excluded.codec,
				mime_codec = excluded.mime_codec,
				is_default = excluded.is_default,
				bitrate = excluded.bitrate
			`,
			ret.Sha, a.Index, a.Title, a.Language, a.Codec, a.MimeCodec, a.IsDefault, a.Bitrate,
		)
	}
	for _, s := range ret.Subtitles {
		tx.Exec(`
			insert into subtitles(sha, idx, title, language, codec, extension, is_default, is_forced, is_hearing_impaired)
			values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			on conflict (sha, idx) do update set
				sha = excluded.sha,
				idx = excluded.idx,
				title = excluded.title,
				language = excluded.language,
				codec = excluded.codec,
				extension = excluded.extension,
				is_default = excluded.is_default,
				is_forced = excluded.is_forced,
				is_hearing_impaired = excluded.is_hearing_impaired
			`,
			ret.Sha, s.Index, s.Title, s.Language, s.Codec, s.Extension, s.IsDefault, s.IsForced, s.IsHearingImpaired,
		)
	}
	for _, c := range ret.Chapters {
		tx.Exec(`
			insert into chapters(sha, start_time, end_time, name, type)
			values ($1, $2, $3, $4, $5)
			on conflict (sha, start_time) do update set
				sha = excluded.sha,
				start_time = excluded.start_time,
				end_time = excluded.end_time,
				name = excluded.name,
				type = excluded.type
			`,
			ret.Sha, c.StartTime, c.EndTime, c.Name, c.Type,
		)
	}
	err = tx.Commit()
	if err != nil {
		return set(ret, err)
	}

	return set(ret, nil)
}
