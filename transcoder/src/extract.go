package src

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"runtime/debug"
	"strings"

	"github.com/zoriya/kyoo/transcoder/src/exec"
	"github.com/zoriya/kyoo/transcoder/src/storage"
	"github.com/zoriya/kyoo/transcoder/src/utils"
)

const ExtractVersion = 1

func (s *MetadataService) ExtractSubs(ctx context.Context, info *MediaInfo) (res any, err error) {
	get_running, set := s.extractLock.Start(info.Sha)
	if get_running != nil {
		return get_running()
	}
	defer func() {
		if r := recover(); r != nil {
			slog.ErrorContext(ctx, "recovered from panic while extracting subtitles",
				"path", info.Path, "panic", fmt.Sprintf("%v", r), "stack", string(debug.Stack()))
			res, err = set(nil, fmt.Errorf("panic while extracting subtitles: %v", r))
		}
	}()

	err = s.extractSubs(ctx, info)
	if err != nil {
		slog.ErrorContext(ctx, "couldn't extract subs", "err", err)
		return set(nil, err)
	}
	_, err = s.Database.Exec(ctx, `update gocoder.info set ver_extract = $2 where id = $1`, info.Id, ExtractVersion)
	return set(nil, err)
}

func (s *MetadataService) GetAttachment(ctx context.Context, sha string, name string) (io.ReadCloser, error) {
	_, err := s.extractLock.WaitFor(sha)
	if err != nil {
		return nil, err
	}

	itemPath := fmt.Sprintf("%s/%s/%s", sha, "att", name)

	item, err := s.storage.GetItem(ctx, itemPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get attachment with path %q: %w", itemPath, err)
	}
	return item, nil
}

func (s *MetadataService) GetSubtitle(
	ctx context.Context,
	path string,
	sha string,
	name string,
) (io.ReadCloser, error) {
	// name is either `{index}.{extension}` or `ext-{filename}.{extension}`
	if filename, ok := strings.CutPrefix(name, "ext-"); ok {
		subPath := filepath.Join(filepath.Dir(path), filename)
		if !isSubtitleFile(subPath) {
			return nil, fmt.Errorf("not a subtitle file: %q", filename)
		}
		return os.Open(subPath)
	}

	_, err := s.extractLock.WaitFor(sha)
	if err != nil {
		return nil, err
	}

	itemPath := fmt.Sprintf("%s/sub/%s", sha, name)

	item, err := s.storage.GetItem(ctx, itemPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get subtitle with path %q: %w", itemPath, err)
	}
	return item, nil
}

func (s *MetadataService) extractSubs(ctx context.Context, info *MediaInfo) (err error) {
	defer utils.PrintExecTime(ctx, "extraction of %s", info.Path)()

	// If there are no supported, embedded subtitles, there is nothing to extract.
	hasSupportedSubtitle := false
	for _, sub := range info.Subtitles {
		if !sub.IsExternal && sub.Extension != nil {
			hasSupportedSubtitle = true
			break
		}
	}
	if !hasSupportedSubtitle {
		return nil
	}

	workdir := filepath.Join(os.TempDir(), info.Sha)
	attDir := filepath.Join(workdir, "att")
	if err := os.MkdirAll(attDir, 0770); err != nil {
		return fmt.Errorf("failed to create attachment directory: %w", err)
	}

	subDir := filepath.Join(workdir, "sub")
	if err := os.MkdirAll(subDir, 0770); err != nil {
		return fmt.Errorf("failed to create subtitles directory: %w", err)
	}

	defer utils.CleanupWithErr(
		&err, func() error {
			return os.RemoveAll(workdir)
		},
		"failed to remove attachment working directory",
	)

	// Dump the attachments and subtitles
	cmd := exec.Command(
		"ffmpeg",
		"-dump_attachment:t", "",
		// override old attachments
		"-y",
		"-i", info.Path,
	)
	cmd.Dir = attDir

	for _, sub := range info.Subtitles {
		if ext := sub.Extension; ext != nil {
			if sub.IsExternal {
				// skip extraction of external subtitles
				continue
			}
			cmd.Args = append(
				cmd.Args,
				"-map", fmt.Sprintf("0:s:%d", *sub.Index),
				"-c:s", "copy",
				fmt.Sprintf("%s/%d.%s", subDir, *sub.Index, *ext),
			)
		}
	}
	slog.InfoContext(ctx, "starting extraction", "command", cmd.String())
	cmd.Stdout = nil

	if err := cmd.Run(); err != nil {
		slog.ErrorContext(ctx, "error starting ffmpeg extract", "err", err)
		return err
	}

	err = storage.SaveFilesToBackend(ctx, s.storage, workdir, info.Sha)
	if err != nil {
		return fmt.Errorf("failed while saving files to backend: %w", err)
	}

	slog.InfoContext(ctx, "extraction finished", "path", info.Path)

	return nil
}
