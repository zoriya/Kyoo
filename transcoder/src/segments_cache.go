package src

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"path"
	"time"

	awshttp "github.com/aws/aws-sdk-go-v2/aws/transport/http"
	s3types "github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/zoriya/kyoo/transcoder/src/storage"
)

// Shared segment cache: completed HLS segments and init files stored in the
// shared StorageBackend so any replica can serve work another replica
// transcoded. Only active with a shared backend (S3); with the local
// filesystem backend segments stay purely pod-local.
//
// Single-owner, no duplicate scheduling: a replica that needs a segment
// first checks the shared cache, otherwise it transcodes locally and uploads
// the result. Two replicas may still race on a cold cache (last PUT wins,
// bytes are equivalent); races need no coordination layer.
//
// Eviction is TTL on last-modification time (no atime in S3): an evicted
// segment is simply re-transcoded on next request.
type SharedSegments struct {
	backend storage.StorageBackend
	ttl     time.Duration
}

func NewSharedSegments(backend storage.StorageBackend, ttl time.Duration) *SharedSegments {
	if _, ok := backend.(*storage.S3StorageBackend); !ok {
		return nil
	}
	return &SharedSegments{backend: backend, ttl: ttl}
}

func segTrack(isVideo bool, idx uint32, quality string) string {
	kind := "a"
	if isVideo {
		kind = "v"
	}
	return fmt.Sprintf("%s-%d-%s", kind, idx, quality)
}

func segKey(sha, track string, segment int32) string {
	return path.Join("segments", sha, track, fmt.Sprintf("seg-%d.mp4", segment))
}

func initKey(sha, track string) string {
	return path.Join("segments", sha, track, "init.mp4")
}

func isNotFound(err error) bool {
	if err == nil {
		return false
	}
	var noSuchKey *s3types.NoSuchKey
	var responseError *awshttp.ResponseError
	if errors.As(err, &noSuchKey) {
		return true
	}
	return errors.As(err, &responseError) &&
		responseError.ResponseError.HTTPStatusCode() == http.StatusNotFound
}

// fetch returns (nil, false, nil) on cache miss.
func (s *SharedSegments) fetch(ctx context.Context, key string) ([]byte, bool, error) {
	rc, err := s.backend.GetItem(ctx, key)
	if isNotFound(err) {
		return nil, false, nil
	}
	if err != nil {
		return nil, false, err
	}
	defer rc.Close()
	data, err := io.ReadAll(rc)
	if err != nil {
		return nil, false, err
	}
	return data, true, nil
}

func (s *SharedSegments) FetchSegment(
	ctx context.Context,
	sha, track string,
	segment int32,
) ([]byte, bool, error) {
	return s.fetch(ctx, segKey(sha, track, segment))
}

func (s *SharedSegments) FetchInit(ctx context.Context, sha, track string) ([]byte, bool, error) {
	return s.fetch(ctx, initKey(sha, track))
}

func (s *SharedSegments) StoreSegment(
	ctx context.Context,
	sha, track string,
	segment int32,
	data []byte,
) error {
	return s.backend.SaveItem(ctx, segKey(sha, track, segment), bytes.NewReader(data))
}

func (s *SharedSegments) StoreInit(ctx context.Context, sha, track string, data []byte) error {
	return s.backend.SaveItem(ctx, initKey(sha, track), bytes.NewReader(data))
}

// Sweep deletes shared segments older than the TTL. Runs on every replica;
// deletes are idempotent so overlapping sweeps are harmless.
func (s *SharedSegments) Sweep(ctx context.Context) error {
	if s.ttl <= 0 {
		return nil
	}
	items, err := s.backend.ListItemsWithMeta(ctx, "segments/")
	if err != nil {
		return err
	}
	cutoff := time.Now().Add(-s.ttl)
	stale := make([]string, 0)
	for _, item := range items {
		if !item.ModTime.IsZero() && item.ModTime.Before(cutoff) {
			stale = append(stale, item.Path)
		}
	}
	for _, key := range stale {
		if err := s.backend.DeleteItem(ctx, key); err != nil {
			slog.WarnContext(ctx, "failed to sweep stale shared segment", "key", key, "err", err)
		}
	}
	if len(stale) > 0 {
		slog.InfoContext(ctx, "swept stale shared segments", "count", len(stale))
	}
	return nil
}
