package storage

import (
	"context"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/zoriya/kyoo/transcoder/src/utils"
)

type FileStorageBackend struct {
	// Base directory for the storage backend
	baseDirectory     string
	baseDirectoryRoot *os.Root
}

// NewFileStorageBackend creates a new FileStorageBackend with the specified base directory.
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
		baseDirectory:     baseDirectory,
		baseDirectoryRoot: root,
	}, nil
}

func (fsb *FileStorageBackend) Close() error {
	if fsb.baseDirectoryRoot != nil {
		return fsb.baseDirectoryRoot.Close()
	}
	return nil
}

// DoesItemExist checks if an item exists in the file storage backend.
func (fsb *FileStorageBackend) DoesItemExist(_ context.Context, path string) (bool, error) {
	_, err := fsb.baseDirectoryRoot.Stat(path)
	if err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}

		return false, fmt.Errorf("failed to check if item %q exists: %w", path, err)
	}

	return true, nil
}

// ListItemsWithPrefix returns a list of items in the storage backend that match the given prefix.
func (fsb *FileStorageBackend) ListItemsWithPrefix(_ context.Context, pathPrefix string) ([]string, error) {
	var items []string
	rootFS := fsb.baseDirectoryRoot.FS()
	// This is split so that a smaller subset of files are checked, rather than literally everything under the base directory.
	// All matching files for the path prefix will also have the prefixDirPath as their parent directory.
	prefixDirPath := filepath.Dir(pathPrefix)

	err := fs.WalkDir(rootFS, prefixDirPath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			// This can happen if prefixDirPath does not exist. The walk function will handle
			// checking this.
			if os.IsNotExist(err) {
				return fs.SkipDir
			}
			return fmt.Errorf("failed on %q while walking directory %q: %w", path, pathPrefix, err)
		}

		// If the path does not start with the prefix, skip it.
		if !strings.HasPrefix(path, pathPrefix) {
			if d.IsDir() {
				// Skip directories that do not match the prefix
				return fs.SkipDir
			}
			return nil
		}

		// Collect matching non-directory items
		if !d.IsDir() {
			items = append(items, path)
		}

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to walk directory %q: %w", pathPrefix, err)
	}

	return items, nil
}

// DeleteItem deletes an item from the storage backend. If the item does not exist, it returns nil.
func (fsb *FileStorageBackend) DeleteItem(_ context.Context, path string) error {
	err := fsb.baseDirectoryRoot.Remove(path)
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete item %q: %w", path, err)
	}
	return nil
}

// DeleteItemsWithPrefix deletes all items in the storage backend that match the given prefix.
// Deletion should be "syncronous" (i.e. the function should block until the write is complete).
func (fsb *FileStorageBackend) DeleteItemsWithPrefix(ctx context.Context, pathPrefix string) error {
	// Unfortunately this implementation is needed until https://go-review.googlesource.com/c/go/+/661595 is released.
	// The new os.Root type does not yet have a RemoveAll method. The next Go release will have this.
	// Once RemoveAll is available, this function can be reduced to a single ReadDir call, a filter, and a RemoveAll call.

	// Get all items with the prefix
	items, err := fsb.ListItemsWithPrefix(ctx, pathPrefix)
	if err != nil {
		return fmt.Errorf("failed to list items with prefix %q: %w", pathPrefix, err)
	}

	// Delete all items. This will leave behind empty directories, but that shouldn't really matter. A future
	// implementation that uses os.Root.RemoveAll will handle this.
	for _, item := range items {
		err = fsb.DeleteItem(ctx, item)
		if err != nil {
			return fmt.Errorf("failed to delete item %q: %w", item, err)
		}
	}

	return nil
}

// SaveItemWithCallback saves an item to the storage backend. If the item already exists, it overwrites it.
// The writeContents function is called with a writer to write the contents of the item.
func (fsb *FileStorageBackend) SaveItemWithCallback(ctx context.Context, path string, writeContents ContentsWriterCallback) (err error) {
	// Open the file for writing
	file, err := fsb.openFileForWriting(path)
	if err != nil {
		return fmt.Errorf("failed to open %q for writing: %w", path, err)
	}
	defer utils.CleanupWithErr(&err, file.Close, "failed to close file %q", path)

	// Write the contents using the provided callback
	if err := writeContents(ctx, file); err != nil {
		return fmt.Errorf("failed to write contents to file %q: %w", path, err)
	}

	return nil
}

// SaveItem saves an item to the storage backend. If the item already exists, it overwrites it.
func (fsb *FileStorageBackend) SaveItem(ctx context.Context, path string, contents io.Reader) (err error) {
	// Open the file for writing
	file, err := fsb.openFileForWriting(path)
	if err != nil {
		return fmt.Errorf("failed to open %q for writing: %w", path, err)
	}
	defer utils.CleanupWithErr(&err, file.Close, "failed to close file %q", path)

	// Copy the contents to the file
	if _, err := io.Copy(file, contents); err != nil {
		return fmt.Errorf("failed to copy contents to file %q: %w", path, err)
	}

	return nil
}

// openFileForWriting opens a file for writing. If the file already exists, it overwrites it.
// The parent directory is created if it doesn't exist.
// This function is used internally to create files in the storage backend.
// The returned file should be closed by the caller.
func (fsb *FileStorageBackend) openFileForWriting(path string) (*os.File, error) {
	// Create the parent directory if it doesn't exist
	dir := filepath.Dir(path)
	if err := fsb.baseDirectoryRoot.Mkdir(dir, 0770); err != nil {
		return nil, fmt.Errorf("failed to create directory %q: %w", dir, err)
	}

	// Open the file for writing
	file, err := fsb.baseDirectoryRoot.OpenFile(path, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0660)
	if err != nil {
		return nil, fmt.Errorf("failed to create file %q: %w", path, err)
	}

	return file, nil
}

// GetItem retrieves an item from the storage backend.
func (fsb *FileStorageBackend) GetItem(_ context.Context, path string) (io.ReadCloser, error) {
	file, err := fsb.baseDirectoryRoot.Open(path)
	if err != nil {
		return nil, fmt.Errorf("failed to open file %q: %w", path, err)
	}

	return file, nil
}
