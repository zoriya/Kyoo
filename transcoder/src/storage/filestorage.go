package storage

import (
	"context"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"

	"github.com/zoriya/kyoo/transcoder/src/utils"
)

type FileStorageBackend struct {
	baseDirectory string
	root          *os.Root
}

func NewFileStorageBackend(baseDirectory string) (*FileStorageBackend, error) {
	// Attempt to create the directory if it doesn't exist
	// This should be the only filesystem call in this file that does not use os.Root.
	// This is to prevent directory traversal attacks when the provided input is untrusted.
	if err := os.MkdirAll(baseDirectory, 0770); err != nil {
		return nil, fmt.Errorf("failed to create storage base directory: %w", err)
	}

	root, err := os.OpenRoot(baseDirectory)
	if err != nil {
		return nil, fmt.Errorf("failed to open storage base directory %q: %w", baseDirectory, err)
	}

	return &FileStorageBackend{
		baseDirectory: baseDirectory,
		root:          root,
	}, nil
}

func (fsb *FileStorageBackend) Close() error {
	if fsb.root != nil {
		return fsb.root.Close()
	}
	return nil
}

func (fsb *FileStorageBackend) DoesItemExist(_ context.Context, path string) (bool, error) {
	_, err := fsb.root.Stat(path)
	if err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}

		return false, fmt.Errorf("failed to check if item %q exists: %w", path, err)
	}

	return true, nil
}

func (fsb *FileStorageBackend) ListItemsWithPrefix(_ context.Context, pathPrefix string) ([]string, error) {
	var items []string

	err := fs.WalkDir(fsb.root.FS(), pathPrefix, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() {
			items = append(items, path)
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return items, nil
}

func (fsb *FileStorageBackend) DeleteItem(_ context.Context, path string) error {
	err := fsb.root.Remove(path)
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete item %q: %w", path, err)
	}
	return nil
}

func (fsb *FileStorageBackend) DeleteItemsWithPrefix(ctx context.Context, pathPrefix string) error {
	return fsb.root.RemoveAll(pathPrefix)
}

func (fsb *FileStorageBackend) SaveItemWithCallback(ctx context.Context, path string, writeContents ContentsWriterCallback) (err error) {
	file, err := fsb.openFileForWriting(path)
	if err != nil {
		return fmt.Errorf("failed to open %q for writing: %w", path, err)
	}
	defer utils.CleanupWithErr(&err, file.Close, "failed to close file %q", path)

	if err := writeContents(ctx, file); err != nil {
		return fmt.Errorf("failed to write contents to file %q: %w", path, err)
	}

	return nil
}

func (fsb *FileStorageBackend) SaveItem(ctx context.Context, path string, contents io.Reader) (err error) {
	file, err := fsb.openFileForWriting(path)
	if err != nil {
		return fmt.Errorf("failed to open %q for writing: %w", path, err)
	}
	defer utils.CleanupWithErr(&err, file.Close, "failed to close file %q", path)

	if _, err := io.Copy(file, contents); err != nil {
		return fmt.Errorf("failed to copy contents to file %q: %w", path, err)
	}

	return nil
}

func (fsb *FileStorageBackend) openFileForWriting(path string) (*os.File, error) {
	dir := filepath.Dir(path)
	if err := fsb.root.MkdirAll(dir, 0770); err != nil {
		return nil, fmt.Errorf("failed to create directory %q: %w", dir, err)
	}

	file, err := fsb.root.OpenFile(path, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0660)
	if err != nil {
		return nil, fmt.Errorf("failed to create file %q: %w", path, err)
	}

	return file, nil
}

func (fsb *FileStorageBackend) GetItem(_ context.Context, path string) (io.ReadCloser, error) {
	file, err := fsb.root.Open(path)
	if err != nil {
		return nil, fmt.Errorf("failed to open file %q: %w", path, err)
	}

	return file, nil
}
