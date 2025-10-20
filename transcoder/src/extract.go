package src

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/zoriya/kyoo/transcoder/src/storage"
	"github.com/zoriya/kyoo/transcoder/src/utils"
)

const ExtractVersion = 1

func (s *MetadataService) ExtractSubs(ctx context.Context, info *MediaInfo) (any, error) {
	get_running, set := s.extractLock.Start(info.Sha)
	if get_running != nil {
		return get_running()
	}

	err := s.extractSubs(ctx, info)
	if err != nil {
		log.Printf("Couldn't extract subs: %v", err)
		return set(nil, err)
	}
	_, err = s.database.Exec(`update info set ver_extract = $2 where sha = $1`, info.Sha, ExtractVersion)
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
	if strings.HasPrefix(name, "ext") {
		// external subtitle already available on the fs
		return os.Open(path)
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
	defer utils.PrintExecTime("extraction of %s", info.Path)()

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
	if err := os.MkdirAll(workdir, 0660); err != nil {
		return fmt.Errorf("failed to create temporary directory: %w", err)
	}

	attDir := filepath.Join(workdir, "att")
	if err := os.MkdirAll(attDir, 0660); err != nil {
		return fmt.Errorf("failed to create attachment directory: %w", err)
	}

	subDir := filepath.Join(workdir, "sub")
	if err := os.MkdirAll(subDir, 0660); err != nil {
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
	log.Printf("Starting extraction with the command: %s", cmd)
	cmd.Stdout = nil

	if err := cmd.Run(); err != nil {
		fmt.Println("Error starting ffmpeg extract:", err)
		return err
	}

	err = storage.SaveFilesToBackend(ctx, s.storage, workdir, info.Sha)
	if err != nil {
		return fmt.Errorf("failed while saving files to backend: %w", err)
	}

	log.Printf("Extraction finished for %s", info.Path)

	return nil
}
