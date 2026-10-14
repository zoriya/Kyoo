package storage

import (
	"context"
	"errors"
)

// ErrNotExist is returned when no avatar exists for the given id.
var ErrNotExist = errors.New("avatar does not exist")

// BlobStorage stores small profile-picture blobs.
// Filesystem is the default; S3 is used when S3_BUCKET_NAME is set so
// multiple auth replicas can share state without a shared filesystem.
// S3 writes are whole-object PUTs (atomic); readers see old or new.
type BlobStorage interface {
	Read(ctx context.Context, id string) ([]byte, error)
	Write(ctx context.Context, id string, data []byte) error
	Delete(ctx context.Context, id string) error
}
