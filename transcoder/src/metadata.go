package src

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"os/user"
	"strings"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/exaring/otelpgx"
	"github.com/golang-migrate/migrate/v4"
	pgxd "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/zoriya/kyoo/transcoder/src/storage"
)

type MetadataService struct {
	Database     *pgxpool.Pool
	lock         RunLock[string, *MediaInfo]
	thumbLock    RunLock[string, any]
	extractLock  RunLock[string, any]
	keyframeLock RunLock[KeyframeKey, *Keyframe]
	storage      storage.StorageBackend
}

func NewMetadataService() (*MetadataService, error) {
	ctx := context.TODO()

	s := &MetadataService{
		lock:         NewRunLock[string, *MediaInfo](),
		thumbLock:    NewRunLock[string, any](),
		extractLock:  NewRunLock[string, any](),
		keyframeLock: NewRunLock[KeyframeKey, *Keyframe](),
	}

	db, err := s.setupDb()
	if err != nil {
		return nil, fmt.Errorf("failed to setup database: %w", err)
	}
	s.Database = db

	storage, err := s.setupStorage(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to setup storage: %w", err)
	}
	s.storage = storage

	return s, nil
}

func (s *MetadataService) Close() error {
	if s.Database != nil {
		s.Database.Close()
	}

	if s.storage != nil {
		if storageCloser, ok := s.storage.(storage.StorageBackendCloser); ok {
			err := storageCloser.Close()
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func (s *MetadataService) setupDb() (*pgxpool.Pool, error) {
	ctx := context.Background()

	connectionString := os.Getenv("POSTGRES_URL")
	config, err := pgxpool.ParseConfig(connectionString)
	if err != nil {
		return nil, errors.New("failed to create postgres config from environment variables")
	}

	// Set default values
	if config.ConnConfig.Host == "/tmp" {
		config.ConnConfig.Host = "postgres"
	}
	if config.ConnConfig.Database == "" {
		config.ConnConfig.Database = "kyoo"
	}
	// The pgx library will set the username to the name of the current user if not provided via
	// environment variable or connection string. Make a best-effort attempt to see if the user
	// was explicitly specified, without implementing full connection string parsing. If not, set
	// the username to the default value of "kyoo".
	if os.Getenv("PGUSER") == "" {
		currentUserName, _ := user.Current()
		// If the username matches the current user and it's not in the connection string, then it was set
		// by the pgx library. This doesn't cover the case where the system username happens to be in some other part
		// of the connection string, but this cannot be checked without full connection string parsing.
		if currentUserName.Username == config.ConnConfig.User && !strings.Contains(connectionString, currentUserName.Username) {
			config.ConnConfig.User = "kyoo"
		}
	}
	if _, ok := config.ConnConfig.RuntimeParams["application_name"]; !ok {
		config.ConnConfig.RuntimeParams["application_name"] = "gocoder"
	}

	config.ConnConfig.Tracer = otelpgx.NewTracer(
		otelpgx.WithDisableQuerySpanNamePrefix(),
		otelpgx.WithIncludeQueryParameters(),
	)

	db, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		fmt.Printf("Could not connect to database, check your env variables!\n")
		return nil, err
	}

	fmt.Println("Migrating database")
	dbi := stdlib.OpenDBFromPool(db)
	defer dbi.Close()

	dbi.Exec("create schema if not exists gocoder")
	driver, err := pgxd.WithInstance(dbi, &pgxd.Config{
		SchemaName: "gocoder",
	})
	if err != nil {
		return nil, err
	}
	m, err := migrate.NewWithDatabaseInstance("file://migrations", "postgres", driver)
	if err != nil {
		return nil, err
	}
	m.Up()
	fmt.Println("Migrating finished")

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
	ret, err := s.getMetadata(ctx, path, sha)
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
		tx, err := s.Database.Begin(ctx)
		if err != nil {
			return nil, err
		}
		tx.Exec(ctx, `update gocoder.videos set keyframes = null where sha = $1`, sha)
		tx.Exec(ctx, `update gocoder.audios set keyframes = null where sha = $1`, sha)
		tx.Exec(ctx, `update gocoder.info set ver_keyframes = 0 where sha = $1`, sha)
		err = tx.Commit(ctx)
		if err != nil {
			fmt.Printf("error deleting old keyframes from database: %v", err)
		}
	}

	return ret, nil
}

func (s *MetadataService) getMetadata(ctx context.Context, path string, sha string) (*MediaInfo, error) {
	rows, _ := s.Database.Query(
		ctx,
		`select
			i.sha, i.path, i.extension, i.mime_codec, i.size, i.duration, i.container, i.fonts,
			jsonb_build_object(
				'info', i.ver_info,
				'extract', i.ver_extract,
				'thumbs', i.ver_thumbs,
				'keyframes', i.ver_keyframes
			) as versions
		from gocoder.info as i
		where i.sha=$1 limit 1`,
		sha,
	)
	ret, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[MediaInfo])

	if errors.Is(err, pgx.ErrNoRows) || (ret.Versions.Info < InfoVersion && ret.Versions.Info != 0) {
		return s.storeFreshMetadata(ctx, path, sha)
	}
	if err != nil {
		return nil, err
	}

	rows, _ = s.Database.Query(
		ctx,
		`select * from gocoder.videos as v where v.sha=$1`,
		sha,
	)
	ret.Videos, err = pgx.CollectRows(rows, pgx.RowToStructByName[Video])
	if err != nil {
		return nil, err
	}

	rows, _ = s.Database.Query(
		ctx,
		`select * from gocoder.audios as a where a.sha=$1`,
		sha,
	)
	ret.Audios, err = pgx.CollectRows(rows, pgx.RowToStructByName[Audio])
	if err != nil {
		return nil, err
	}

	rows, _ = s.Database.Query(
		ctx,
		`select * from gocoder.subtitles as s where s.sha=$1`,
		sha,
	)
	ret.Subtitles, err = pgx.CollectRows(rows, pgx.RowToStructByName[Subtitle])
	if err != nil {
		return nil, err
	}
	for i, s := range ret.Subtitles {
		if s.Extension != nil {
			link := fmt.Sprintf(
				"/video/%s/subtitle/%d.%s",
				base64.RawURLEncoding.EncodeToString([]byte(ret.Path)),
				*s.Index,
				*s.Extension,
			)
			ret.Subtitles[i].Link = &link
		}
	}
	err = ret.SearchExternalSubtitles()
	if err != nil {
		fmt.Printf("Couldn't find external subtitles: %v", err)
	}

	rows, _ = s.Database.Query(
		ctx,
		`select * from gocoder.chapters as c where c.sha=$1`,
		sha,
	)
	ret.Chapters, err = pgx.CollectRows(rows, pgx.RowToStructByName[Chapter])
	if err != nil {
		return nil, err
	}
	return &ret, nil
}

func (s *MetadataService) storeFreshMetadata(ctx context.Context, path string, sha string) (*MediaInfo, error) {
	get_running, set := s.lock.Start(sha)
	if get_running != nil {
		return get_running()
	}

	ret, err := RetriveMediaInfo(path, sha)
	if err != nil {
		return set(nil, err)
	}

	tx, err := s.Database.Begin(ctx)
	if err != nil {
		return set(ret, err)
	}

	// it needs to be a delete instead of a on conflict do update because we want to trigger delete casquade for
	// videos/audios & co.
	tx.Exec(ctx, `delete from gocoder.info where path = $1`, path)
	tx.Exec(ctx,
		`
		insert into gocoder.info(sha, path, extension, mime_codec, size, duration, container,
		fonts, ver_info, ver_extract, ver_thumbs, ver_keyframes)
		values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		`,
		// on conflict do not update versions of extract/thumbs/keyframes
		ret.Sha, ret.Path, ret.Extension, ret.MimeCodec, ret.Size, ret.Duration, ret.Container,
		ret.Fonts, ret.Versions.Info, ret.Versions.Extract, ret.Versions.Thumbs, ret.Versions.Keyframes,
	)
	for _, v := range ret.Videos {
		tx.Exec(
			ctx,
			`
			insert into gocoder.videos(sha, idx, title, language, codec, mime_codec, width, height, is_default, bitrate)
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
		tx.Exec(
			ctx,
			`
			insert into gocoder.audios(sha, idx, title, language, codec, mime_codec, is_default, bitrate)
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
		tx.Exec(
			ctx,
			`
			insert into gocoder.subtitles(sha, idx, title, language, codec, extension, is_default, is_forced, is_hearing_impaired)
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
		tx.Exec(
			ctx,
			`
			insert into gocoder.chapters(sha, start_time, end_time, name, type)
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
	err = tx.Commit(ctx)
	if err != nil {
		return set(ret, err)
	}

	err = ret.SearchExternalSubtitles()
	if err != nil {
		return set(ret, err)
	}

	return set(ret, nil)
}
