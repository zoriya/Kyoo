package storage

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"

	awshttp "github.com/aws/aws-sdk-go-v2/aws/transport/http"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3types "github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// S3BlobStorage keeps avatars in S3-compatible object storage.
// Keys are the plain avatar id; PROFILE_PICTURE_PATH only applies to the
// filesystem backend.
type S3BlobStorage struct {
	client *s3.Client
	bucket string
}

func NewS3BlobStorage(client *s3.Client, bucket string) *S3BlobStorage {
	return &S3BlobStorage{client: client, bucket: bucket}
}

func (s *S3BlobStorage) Read(ctx context.Context, id string) ([]byte, error) {
	resp, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: &s.bucket,
		Key:    &id,
	})
	if err != nil {
		var noSuchKey *s3types.NoSuchKey
		var responseError *awshttp.ResponseError
		if errors.As(err, &noSuchKey) {
			return nil, ErrNotExist
		}
		if errors.As(err, &responseError) &&
			responseError.ResponseError.HTTPStatusCode() == http.StatusNotFound {
			return nil, ErrNotExist
		}
		return nil, fmt.Errorf("failed to get avatar %q: %w", id, err)
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

func (s *S3BlobStorage) Write(ctx context.Context, id string, data []byte) error {
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: &s.bucket,
		Key:    &id,
		Body:   bytes.NewReader(data),
	})
	if err != nil {
		return fmt.Errorf("failed to put avatar %q: %w", id, err)
	}
	return nil
}

func (s *S3BlobStorage) Delete(ctx context.Context, id string) error {
	exists, err := s.exists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return ErrNotExist
	}
	_, err = s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: &s.bucket,
		Key:    &id,
	})
	if err != nil {
		return fmt.Errorf("failed to delete avatar %q: %w", id, err)
	}
	return nil
}

func (s *S3BlobStorage) exists(ctx context.Context, id string) (bool, error) {
	_, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: &s.bucket,
		Key:    &id,
	})
	if err != nil {
		var responseError *awshttp.ResponseError
		if errors.As(err, &responseError) &&
			responseError.ResponseError.HTTPStatusCode() == http.StatusNotFound {
			return false, nil
		}
		return false, fmt.Errorf("failed to check avatar %q: %w", id, err)
	}
	return true, nil
}

