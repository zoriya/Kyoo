package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	awshttp "github.com/aws/aws-sdk-go-v2/aws/transport/http"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3types "github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/zoriya/kyoo/transcoder/src/utils"
	"golang.org/x/sync/errgroup"
)

var noSuchKeyError = &s3types.NoSuchKey{}

// S3StorageBackend is a struct that implements the StorageBackend interface,
// backed by S3-compatible object storage.
// It is up to the user to ensure that the object storage service supports
// consistent reads, writes, and deletes. This known to be supported by:
// - AWS S3
// - MinIO
// - Ceph RGW
// This is known to _not_ be supported by:
// - SeaweedFS
type S3StorageBackend struct {
	s3Client *s3.Client
	bucket   string
}

// NewS3StorageBackend creates a new S3StorageBackend with the specified bucket name and S3 client.
func NewS3StorageBackend(s3Client *s3.Client, bucket string) *S3StorageBackend {
	return &S3StorageBackend{
		s3Client: s3Client,
		bucket:   bucket,
	}
}

// DoesItemExist checks if an item exists in the file storage backend.
func (ssb *S3StorageBackend) DoesItemExist(ctx context.Context, path string) (bool, error) {
	_, err := ssb.s3Client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: &ssb.bucket,
		Key:    &path,
	})
	if err != nil {
		var responseError *awshttp.ResponseError
		if errors.As(err, &responseError) && responseError.ResponseError.HTTPStatusCode() == http.StatusNotFound {
			return false, nil
		}

		return false, fmt.Errorf("failed to check if item %q exists in bucket %q: %w", path, ssb.bucket, err)
	}

	return true, nil
}

// ListItemsWithPrefix returns a list of items in the storage backend that match the given prefix.
func (ssb *S3StorageBackend) ListItemsWithPrefix(ctx context.Context, pathPrefix string) ([]string, error) {
	listObjectsInput := &s3.ListObjectsV2Input{
		Bucket: &ssb.bucket,
		Prefix: &pathPrefix,
	}

	paginator := s3.NewListObjectsV2Paginator(ssb.s3Client, listObjectsInput)

	var items []string
	for paginator.HasMorePages() {
		resp, err := paginator.NextPage(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to list items with prefix %q in bucket %q: %w", pathPrefix, ssb.bucket, err)
		}

		for _, item := range resp.Contents {
			if item.Key != nil {
				items = append(items, *item.Key)
			}
		}
	}

	return items, nil
}

// DeleteItem deletes an item from the storage backend. If the item does not exist, it returns nil.
func (ssb *S3StorageBackend) DeleteItem(ctx context.Context, path string) error {
	_, err := ssb.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: &ssb.bucket,
		Key:    &path,
	})
	if err != nil {
		if errors.Is(err, noSuchKeyError) {
			return nil
		}
		return fmt.Errorf("failed to delete item %q from bucket %q: %w", path, ssb.bucket, err)
	}

	return nil
}

// DeleteItemsWithPrefix deletes all items in the storage backend that match the given prefix.
// Deletion should be "syncronous" (i.e. the function should block until the write is complete).
func (ssb *S3StorageBackend) DeleteItemsWithPrefix(ctx context.Context, pathPrefix string) error {
	// Get all items with the prefix
	items, err := ssb.ListItemsWithPrefix(ctx, pathPrefix)
	if err != nil {
		return fmt.Errorf("failed to list items with prefix %q: %w", pathPrefix, err)
	}

	// Fast path: if there are no items, return early.
	if len(items) == 0 {
		return nil
	}

	// Delete all items. This uses the DeleteObjects API call, which is more efficient
	// than deleting each item individually.

	// The API call supports up to 1000 items at a time, so chunk the items if needed.
	chunkSize := min(len(items), 1000)
	chunkItems := make([]s3types.ObjectIdentifier, chunkSize)
	var deletionRequests errgroup.Group

	for i := range items {
		item := items[i]
		chunkIndex := i % chunkSize

		chunkItems[chunkIndex] = s3types.ObjectIdentifier{
			Key: &item,
		}

		// If the chunk is full, delete the objects in this chunk.
		if chunkIndex == chunkSize-1 {
			deletionRequests.Go(func() error {
				_, err := ssb.s3Client.DeleteObjects(ctx, &s3.DeleteObjectsInput{
					Bucket: &ssb.bucket,
					Delete: &s3types.Delete{
						Objects: chunkItems,
						// Only include keys in the response that encountered an error.
						Quiet: aws.Bool(true),
					},
				})

				if err != nil {
					chunkNumber := 1 + i/chunkSize // Int division in Go rounds down.
					// TODO if the error doesn't include sufficient information, the below line
					// will need to pull in error details from the response.
					return fmt.Errorf("failed to delete items in chunk %d with prefix %q: %w", chunkNumber, pathPrefix, err)
				}

				return nil
			})
		}
	}

	err = deletionRequests.Wait()
	if err != nil {
		return fmt.Errorf("failed to delete one or more items with prefix %q: %w", pathPrefix, err)
	}

	return nil
}

// SaveItemWithCallback saves an item to the storage backend. If the item already exists, it overwrites it.
// The writeContents function is called with a writer to write the contents of the item.
func (ssb *S3StorageBackend) SaveItemWithCallback(ctx context.Context, path string, writeContents ContentsWriterCallback) (err error) {
	// Create a pipe to connect the writer and reader.
	pr, pw := io.Pipe()

	// Start a goroutine to write to the pipe.
	// Writing and reading must occur concurrently to avoid deadlocks.

	// Use a separate context for the writer to allow cancellation if the upload fails. This is important to avoid
	// a hung goroutine leak if the upload fails.
	writeCtx, cancel := context.WithCancel(ctx)

	var writerGroup errgroup.Group
	writerGroup.Go(func() (err error) {
		defer utils.CleanupWithErr(&err, pw.Close, "failed to close pipe writer")
		return writeContents(writeCtx, pw)
	})

	// Handle cleanup and avoid a goroutines leak.
	// Order is critical here. If the context is not cancelled, or the pipe is not closed
	// before waiting for the writer to finish, there can be a deadlock. This happens when
	// a writer without context support is waiting for written bytes to be read.
	// Remember: the last deferred function is executed first.
	// Wait for the write to complete and check for errors.
	// This should always happen even if saving fails, to prevent a goroutine leak.
	defer utils.CleanupWithErr(&err, writerGroup.Wait, "writer callback failed")
	defer utils.CleanupWithErr(&err, pr.Close, "failed to close pipe reader")
	defer cancel()

	// Upload the object to S3 using the pipe as the body.
	if err := ssb.SaveItem(ctx, path, pr); err != nil {
		return fmt.Errorf("failed to save item with path %q: %w", path, err)
	}

	return nil
}

// SaveItem saves an item to the storage backend. If the item already exists, it overwrites it.
func (ssb *S3StorageBackend) SaveItem(ctx context.Context, path string, contents io.Reader) error {
	// Upload the object to S3 using the provided reader as the body.
	_, err := ssb.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: &ssb.bucket,
		Key:    &path,
		Body:   contents,
	})
	if err != nil {
		return fmt.Errorf("failed to save item %q to bucket %q: %w", path, ssb.bucket, err)
	}

	return nil
}

// GetItem retrieves an item from the storage backend.
func (ssb *S3StorageBackend) GetItem(ctx context.Context, path string) (io.ReadCloser, error) {
	resp, err := ssb.s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: &ssb.bucket,
		Key:    &path,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get item %q from bucket %q: %w", path, ssb.bucket, err)
	}

	return resp.Body, nil
}
