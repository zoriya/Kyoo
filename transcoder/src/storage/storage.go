package storage

import (
	"context"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"

	"golang.org/x/sync/errgroup"
)

type ContentsWriterCallback func(ctx context.Context, writer io.Writer) error

// Handles storage and retrieval of items in a storage backend.
// "Items" are pieces of data that can be stored and retrieved.
// Paths with ".." are not allowed, and may result in unexpected behavior.
type StorageBackend interface {
	DoesItemExist(ctx context.Context, path string) (bool, error)
	// Note: returned items may have a "/" in them, e.g. "foo/bar/baz".
	ListItemsWithPrefix(ctx context.Context, pathPrefix string) ([]string, error)
	// DeleteItem deletes an item from the storage backend. If the item does not exist, it returns nil.
	// Deletion should be "synchronous" (i.e. the function should block until the write is complete).
	DeleteItem(ctx context.Context, path string) error
	// DeleteItemsWithPrefix deletes all items in the storage backend that match the given prefix.
	// Deletion should be "synchronous" (i.e. the function should block until the write is complete).
	DeleteItemsWithPrefix(ctx context.Context, pathPrefix string) error
	// SaveItemWithCallback saves an item to the storage backend. If the item already exists, it overwrites it.
	// The writeContents function is called with a writer to write the contents of the item.
	// Writes should be "synchronous" (i.e. the function should block until the write is complete).
	SaveItemWithCallback(ctx context.Context, path string, writeContents ContentsWriterCallback) error
	// SaveItem saves an item to the storage backend. If the item already exists, it overwrites it.
	SaveItem(ctx context.Context, path string, contents io.Reader) error
	// GetItem retrieves an item from the storage backend.
	GetItem(ctx context.Context, path string) (io.ReadCloser, error)
}

type StorageBackendCloser interface {
	StorageBackend
	// Close closes the storage backend. This should be called when the backend is no longer needed.
	Close() error
}

func SaveFilesToBackend(ctx context.Context, backend StorageBackend, source, dest string) error {
	// Allow for save in parallel. Running in series can be slow with many files.
	var saveGroup errgroup.Group

	err := filepath.WalkDir(source, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if d.IsDir() {
			return nil
		}

		rel, err := filepath.Rel(source, path)
		if err != nil {
			return err
		}
		dest := filepath.Join(dest, rel)

		saveGroup.Go(func() (err error) {
			file, err := os.Open(path)
			if err != nil {
				return err
			}
			defer file.Close()

			if err := backend.SaveItem(ctx, dest, file); err != nil {
				return fmt.Errorf("failed to save file %q to backend: %w", path, err)
			}

			return nil
		})

		return nil
	})
	if err != nil {
		return fmt.Errorf("failed while walking over files to save to the backend: %w", err)
	}

	if err := saveGroup.Wait(); err != nil {
		return fmt.Errorf("failed to save files to backend: %w", err)
	}

	return nil
}
