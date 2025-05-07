package src

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/zoriya/kyoo/transcoder/src/storage"
	"github.com/zoriya/kyoo/transcoder/src/utils"
	"golang.org/x/sync/errgroup"
)

const ExtractVersion = 1

func (s *MetadataService) ExtractSubs(ctx context.Context, info *MediaInfo) (interface{}, error) {
	get_running, set := s.extractLock.Start(info.Sha)
	if get_running != nil {
		return get_running()
	}

	err := s.extractSubs(ctx, info)
	if err != nil {
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

func (s *MetadataService) GetSubtitle(ctx context.Context, sha string, name string) (io.ReadCloser, error) {
	_, err := s.extractLock.WaitFor(sha)
	if err != nil {
		return nil, err
	}

	itemPath := fmt.Sprintf("%s/%s/%s", sha, "sub", name)

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

	// Create a temporary directory for writing attachments
	// TODO if the transcoder ever uses the ffmpeg library directly, remove this
	// and write directly to storage via stream instead
	tempWorkingDirectory := filepath.Join(os.TempDir(), info.Sha)
	if err := os.MkdirAll(tempWorkingDirectory, 0660); err != nil {
		return fmt.Errorf("failed to create temporary directory: %w", err)
	}

	attachmentWorkingDirectory := filepath.Join(tempWorkingDirectory, "att")
	if err := os.MkdirAll(attachmentWorkingDirectory, 0660); err != nil {
		return fmt.Errorf("failed to create attachment directory: %w", err)
	}

	subtitlesWorkingDirectory := filepath.Join(tempWorkingDirectory, "sub")
	if err := os.MkdirAll(subtitlesWorkingDirectory, 0660); err != nil {
		return fmt.Errorf("failed to create subtitles directory: %w", err)
	}

	defer utils.CleanupWithErr(
		&err, func() error {
			return os.RemoveAll(attachmentWorkingDirectory)
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
	cmd.Dir = attachmentWorkingDirectory

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
				fmt.Sprintf("%s/%d.%s", subtitlesWorkingDirectory, *sub.Index, *ext),
			)
		}
	}
	log.Printf("Starting extraction with the command: %s", cmd)
	cmd.Stdout = nil

	if err := cmd.Run(); err != nil {
		fmt.Println("Error starting ffmpeg extract:", err)
		return err
	}

	// Move attachments and subtitles to the storage backend
	var saveGroup errgroup.Group
	saveGroup.Go(func() error {
		err := storage.SaveFilesToBackend(ctx, s.storage, attachmentWorkingDirectory, filepath.Join(info.Sha, "att"))
		if err != nil {
			return fmt.Errorf("failed to save attachments to backend: %w", err)
		}
		return nil
	})

	saveGroup.Go(func() error {
		err := storage.SaveFilesToBackend(ctx, s.storage, subtitlesWorkingDirectory, filepath.Join(info.Sha, "sub"))
		if err != nil {
			return fmt.Errorf("failed to save subtitles to backend: %w", err)
		}
		return nil
	})

	if err := saveGroup.Wait(); err != nil {
		return fmt.Errorf("failed while saving files to backend: %w", err)
	}

	return nil
}
