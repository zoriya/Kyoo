package storage

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

// FileBlobStorage keeps avatars on the local filesystem.
// Writes go through tmp-file+rename so concurrent replicas sharing a
// volume never observe torn files.
type FileBlobStorage struct {
	base string
}

func NewFileBlobStorage(base string) (*FileBlobStorage, error) {
	if err := os.MkdirAll(base, 0o755); err != nil {
		return nil, fmt.Errorf("failed to create profile picture dir: %w", err)
	}
	return &FileBlobStorage{base: base}, nil
}

func (s *FileBlobStorage) path(id string) string {
	return filepath.Join(s.base, id)
}

func (s *FileBlobStorage) Read(ctx context.Context, id string) ([]byte, error) {
	data, err := os.ReadFile(s.path(id))
	if errors.Is(err, os.ErrNotExist) {
		return nil, ErrNotExist
	}
	return data, err
}

func (s *FileBlobStorage) Write(ctx context.Context, id string, data []byte) error {
	if err := os.MkdirAll(s.base, 0o755); err != nil {
		return err
	}

	tmp, err := os.CreateTemp(s.base, id+"-*.tmp")
	if err != nil {
		return err
	}
	tmpPath := tmp.Name()
	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		os.Remove(tmpPath)
		return err
	}
	if err := tmp.Close(); err != nil {
		os.Remove(tmpPath)
		return err
	}
	if err := os.Rename(tmpPath, s.path(id)); err != nil {
		os.Remove(tmpPath)
		return err
	}
	return nil
}

func (s *FileBlobStorage) Delete(ctx context.Context, id string) error {
	err := os.Remove(s.path(id))
	if errors.Is(err, os.ErrNotExist) {
		return ErrNotExist
	}
	return err
}
