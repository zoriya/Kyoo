package src

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"os/user"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	pgxd "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
)

type MetadataService struct {
	database     *pgxpool.Pool
	lock         RunLock[string, *MediaInfo]
	thumbLock    RunLock[string, interface{}]
	extractLock  RunLock[string, interface{}]
	keyframeLock RunLock[KeyframeKey, *Keyframe]
}

func NewMetadataService(ctx context.Context) (*MetadataService, error) {
	s := &MetadataService{
		lock:         NewRunLock[string, *MediaInfo](),
		thumbLock:    NewRunLock[string, interface{}](),
		extractLock:  NewRunLock[string, interface{}](),
		keyframeLock: NewRunLock[KeyframeKey, *Keyframe](),
	}

	db, err := s.doDBSetup(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to setup database: %w", err)
	}
	s.database = db

	return &MetadataService{
		database:     db,
		lock:         NewRunLock[string, *MediaInfo](),
		thumbLock:    NewRunLock[string, interface{}](),
		extractLock:  NewRunLock[string, interface{}](),
		keyframeLock: NewRunLock[KeyframeKey, *Keyframe](),
	}, nil
}

func (s *MetadataService) doDBSetup(ctx context.Context) (*pgxpool.Pool, error) {
	connectionString := GetEnvOr("POSTGRES_URL", "")
	config, err := pgxpool.ParseConfig(connectionString)
	if err != nil {
		return nil, errors.New("failed to create postgres config from environment variables")
	}

	// Set default values
	if config.ConnConfig.Host == "" {
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
	if config.ConnConfig.Password == "" {
		config.ConnConfig.Password = "password"
	}
	if _, ok := config.ConnConfig.RuntimeParams["application_name"]; !ok {
		config.ConnConfig.RuntimeParams["application_name"] = "keibi"
	}

	schema := GetEnvOr("POSTGRES_SCHEMA", "keibi")
	if _, ok := config.ConnConfig.RuntimeParams["search_path"]; !ok {
		config.ConnConfig.RuntimeParams["search_path"] = schema
	}

	db, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		fmt.Printf("Could not connect to database, check your env variables!")
		return nil, err
	}

	if schema != "disabled" {
		_, err = db.Exec(ctx, fmt.Sprintf("create schema if not exists %s", schema))
		if err != nil {
			return nil, err
		}
	}

	fmt.Println("Migrating database")
	dbi := stdlib.OpenDBFromPool(db)
	defer dbi.Close()

	driver, err := pgxd.WithInstance(dbi, &pgxd.Config{})
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
		tx, err := s.database.Begin(ctx)
		if err != nil {
			return nil, err
		}
		tx.Exec(ctx, `update videos set keyframes = null where sha = $1`, sha)
		tx.Exec(ctx, `update audios set keyframes = null where sha = $1`, sha)
		tx.Exec(ctx, `update info set ver_keyframes = 0 where sha = $1`, sha)
		err = tx.Commit(ctx)
		if err != nil {
			fmt.Printf("error deleteing old keyframes from database: %v", err)
		}
	}

	return ret, nil
}

func (s *MetadataService) getMetadata(ctx context.Context, path string, sha string) (*MediaInfo, error) {
	var ret MediaInfo
	err := s.database.QueryRow(
		ctx,
		`select i.sha, i.path, i.extension, i.mime_codec, i.size, i.duration, i.container,
		i.fonts, i.ver_info, i.ver_extract, i.ver_thumbs, i.ver_keyframes
		from info as i where i.sha=$1`,
		sha,
	).Scan(
		&ret.Sha, &ret.Path, &ret.Extension, &ret.MimeCodec, &ret.Size, &ret.Duration, &ret.Container,
		&ret.Fonts, &ret.Versions.Info, &ret.Versions.Extract, &ret.Versions.Thumbs, &ret.Versions.Keyframes,
	)
	ret.Videos = make([]Video, 0)
	ret.Audios = make([]Audio, 0)
	ret.Subtitles = make([]Subtitle, 0)
	ret.Chapters = make([]Chapter, 0)

	if errors.Is(err, pgx.ErrNoRows) || (ret.Versions.Info < InfoVersion && ret.Versions.Info != 0) {
		return s.storeFreshMetadata(ctx, path, sha)
	}
	if err != nil {
		return nil, err
	}

	rows, err := s.database.Query(
		ctx,
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
		ctx,
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
		ctx,
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
				"%s/%s/subtitle/%d.%s",
				Settings.RoutePrefix,
				base64.RawURLEncoding.EncodeToString([]byte(ret.Path)),
				*s.Index,
				*s.Extension,
			)
			s.Link = &link
		}
		ret.Subtitles = append(ret.Subtitles, s)
	}

	rows, err = s.database.Query(
		ctx,
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

func (s *MetadataService) storeFreshMetadata(ctx context.Context, path string, sha string) (*MediaInfo, error) {
	get_running, set := s.lock.Start(sha)
	if get_running != nil {
		return get_running()
	}

	ret, err := RetriveMediaInfo(path, sha)
	if err != nil {
		return set(nil, err)
	}

	tx, err := s.database.Begin(ctx)
	// it needs to be a delete instead of a on conflict do update because we want to trigger delete casquade for
	// videos/audios & co.
	tx.Exec(ctx, `delete from info where path = $1`, path)
	tx.Exec(
		ctx,
		`
		insert into info(sha, path, extension, mime_codec, size, duration, container,
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
		tx.Exec(
			ctx,
			`
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
		tx.Exec(
			ctx,
			`
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
		tx.Exec(
			ctx,
			`
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
	err = tx.Commit(ctx)
	if err != nil {
		return set(ret, err)
	}

	return set(ret, nil)
}
