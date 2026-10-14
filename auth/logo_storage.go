package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	awshttp "github.com/aws/aws-sdk-go-v2/aws/transport/http"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3types "github.com/aws/aws-sdk-go-v2/service/s3/types"
)

var errLogoNotFound = errors.New("no manual logo found")

// logoStore keeps profile pictures on the local filesystem by default, or in
// S3-compatible storage when bucket is set so auth replicas share state
// without a shared filesystem. S3 writes are whole-object PUTs (atomic);
// local writes go through tmp-file+rename.
type logoStore struct {
	dir    string
	s3     *s3.Client
	bucket string
}

func newLogoStore(ctx context.Context, dir, bucket string) (*logoStore, error) {
	if bucket == "" {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return nil, err
		}
		return &logoStore{dir: dir}, nil
	}
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}
	return &logoStore{s3: s3.NewFromConfig(cfg), bucket: bucket}, nil
}

func (s *logoStore) read(ctx context.Context, id string) ([]byte, error) {
	if s.bucket == "" {
		data, err := os.ReadFile(filepath.Join(s.dir, id))
		if errors.Is(err, os.ErrNotExist) {
			return nil, errLogoNotFound
		}
		return data, err
	}
	resp, err := s.s3.GetObject(ctx, &s3.GetObjectInput{Bucket: &s.bucket, Key: &id})
	if err != nil {
		var noSuchKey *s3types.NoSuchKey
		var responseError *awshttp.ResponseError
		if errors.As(err, &noSuchKey) {
			return nil, errLogoNotFound
		}
		if errors.As(err, &responseError) &&
			responseError.ResponseError.HTTPStatusCode() == http.StatusNotFound {
			return nil, errLogoNotFound
		}
		return nil, err
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

func (s *logoStore) write(ctx context.Context, id string, data []byte) error {
	if s.bucket == "" {
		tmp, err := os.CreateTemp(s.dir, id+"-*.tmp")
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
		if err := os.Rename(tmpPath, filepath.Join(s.dir, id)); err != nil {
			os.Remove(tmpPath)
			return err
		}
		return nil
	}
	_, err := s.s3.PutObject(ctx, &s3.PutObjectInput{
		Bucket: &s.bucket,
		Key:    &id,
		Body:   bytes.NewReader(data),
	})
	return err
}

func (s *logoStore) delete(ctx context.Context, id string) error {
	if s.bucket == "" {
		err := os.Remove(filepath.Join(s.dir, id))
		if errors.Is(err, os.ErrNotExist) {
			return errLogoNotFound
		}
		return err
	}
	if _, err := s.s3.HeadObject(ctx, &s3.HeadObjectInput{Bucket: &s.bucket, Key: &id}); err != nil {
		var responseError *awshttp.ResponseError
		if errors.As(err, &responseError) &&
			responseError.ResponseError.HTTPStatusCode() == http.StatusNotFound {
			return errLogoNotFound
		}
		return err
	}
	_, err := s.s3.DeleteObject(ctx, &s3.DeleteObjectInput{Bucket: &s.bucket, Key: &id})
	return err
}
