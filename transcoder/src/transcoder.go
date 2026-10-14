package src

import (
	"context"
	"log/slog"
	"os"
	"path"
	"time"
)

type Transcoder struct {
	// All file streams currently running, index is sha
	streams         CMap[string, *FileStream]
	clientChan      chan ClientInfo
	tracker         *Tracker
	metadataService *MetadataService
	// Shared cache of completed segments (nil without a shared S3 backend).
	shared *SharedSegments
}

func NewTranscoder(metadata *MetadataService) (*Transcoder, error) {
	out := Settings.Outpath
	// Segments are per-pod cache (emptyDir /cache): clear stale state from a
	// previous run of this pod. Best-effort only: never fail boot because a
	// stale file is busy, and never wipe anything outside our own Outpath.
	os.MkdirAll(out, 0o755)
	dir, err := os.ReadDir(out)
	if err != nil {
		slog.Warn("could not list transcode cache, continuing with stale files", "err", err)
	} else {
		for _, d := range dir {
			if err := os.RemoveAll(path.Join(out, d.Name())); err != nil {
				slog.Warn("could not clear stale transcode cache entry, continuing", "entry", d.Name(), "err", err)
			}
		}
	}

	ret := &Transcoder{
		streams:         NewCMap[string, *FileStream](),
		clientChan:      make(chan ClientInfo, 2048),
		metadataService: metadata,
		shared:          NewSharedSegments(metadata.Storage(), Settings.SegmentsTTL),
	}
	ret.tracker = NewTracker(ret)
	if ret.shared != nil {
		slog.Info("shared segment cache enabled, starting sweeper", "ttl", Settings.SegmentsTTL.String())
		go ret.sweepSharedSegments()
	}
	return ret, nil
}

// sweepSharedSegments periodically evicts shared segments older than the TTL.
// Deletes are idempotent, so overlapping sweeps across replicas are harmless.
func (t *Transcoder) sweepSharedSegments() {
	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()
	for range ticker.C {
		ctx := context.WithoutCancel(context.Background())
		if err := t.shared.Sweep(ctx); err != nil {
			slog.WarnContext(ctx, "shared segment sweep failed", "err", err)
		}
	}
}

// track records viewer activity for the tracker goroutine. It is intentionally
// non-blocking and best-effort: client tracking only drives background cleanup,
// and every route re-sends fresh info on the next request. Blocking here would
// couple request latency to the tracker's health - if the tracker ever stalls
// (e.g. inside a Kill), a blocking send on a full channel would hang every
// in-flight request (index.m3u8, segments, ...) behind it.
func (t *Transcoder) track(info ClientInfo) {
	select {
	case t.clientChan <- info:
	default:
		slog.Warn("client tracking channel full, dropping update", "client", info.client, "sha", info.sha)
	}
}

func (t *Transcoder) getFileStream(ctx context.Context, path string, sha string) (*FileStream, error) {
	ctx = context.WithoutCancel(ctx)
	ret, _ := t.streams.GetOrCreate(sha, func() *FileStream {
		return t.newFileStream(ctx, path, sha)
	})
	ret.ready.Wait()
	if ret.err != nil {
		t.streams.Remove(sha)
		return nil, ret.err
	}
	return ret, nil
}

func (t *Transcoder) GetMaster(ctx context.Context, path string, client string, query string, profileId *string, sessionId *string, sha string) (string, error) {
	ctx = context.WithoutCancel(ctx)
	stream, err := t.getFileStream(ctx, path, sha)
	if err != nil {
		return "", err
	}
	t.track(ClientInfo{
		client:    client,
		profileId: profileId,
		sessionId: sessionId,
		sha:       sha,
		path:      path,
		video:     nil,
		audio:     nil,
		vhead:     -1,
		ahead:     -1,
	})
	return stream.GetMaster(ctx, query), nil
}

func (t *Transcoder) GetVideoIndex(
	ctx context.Context,
	path string,
	video uint32,
	quality VideoQuality,
	client string,
	query string,
	profileId *string,
	sessionId *string,
	sha string,
) (string, error) {
	ctx = context.WithoutCancel(ctx)
	stream, err := t.getFileStream(ctx, path, sha)
	if err != nil {
		return "", err
	}
	t.track(ClientInfo{
		client:    client,
		profileId: profileId,
		sessionId: sessionId,
		sha:       sha,
		path:      path,
		video:     &VideoKey{video, quality},
		audio:     nil,
		vhead:     -1,
		ahead:     -1,
	})
	return stream.GetVideoIndex(ctx, video, quality, query)
}

func (t *Transcoder) GetAudioIndex(
	ctx context.Context,
	path string,
	audio uint32,
	quality AudioQuality,
	client string,
	query string,
	profileId *string,
	sessionId *string,
	sha string,
) (string, error) {
	ctx = context.WithoutCancel(ctx)
	stream, err := t.getFileStream(ctx, path, sha)
	if err != nil {
		return "", err
	}
	t.track(ClientInfo{
		client:    client,
		profileId: profileId,
		sessionId: sessionId,
		sha:       sha,
		path:      path,
		audio:     &AudioKey{audio, quality},
		vhead:     -1,
		ahead:     -1,
	})
	return stream.GetAudioIndex(ctx, audio, quality, query)
}

func (t *Transcoder) GetVideoSegment(
	ctx context.Context,
	path string,
	video uint32,
	quality VideoQuality,
	segment int32,
	client string,
	profileId *string,
	sessionId *string,
	sha string,
) (string, error) {
	ctx = context.WithoutCancel(ctx)
	stream, err := t.getFileStream(ctx, path, sha)
	if err != nil {
		return "", err
	}
	t.track(ClientInfo{
		client:    client,
		profileId: profileId,
		sessionId: sessionId,
		sha:       sha,
		path:      path,
		video:     &VideoKey{video, quality},
		vhead:     segment,
		audio:     nil,
		ahead:     -1,
	})
	return stream.GetVideoSegment(ctx, video, quality, segment)
}

func (t *Transcoder) GetVideoInit(
	ctx context.Context,
	path string,
	video uint32,
	quality VideoQuality,
	sha string,
) (string, error) {
	ctx = context.WithoutCancel(ctx)
	stream, err := t.getFileStream(ctx, path, sha)
	if err != nil {
		return "", err
	}
	return stream.GetVideoInit(ctx, video, quality)
}

func (t *Transcoder) GetAudioInit(
	ctx context.Context,
	path string,
	audio uint32,
	quality AudioQuality,
	sha string,
) (string, error) {
	ctx = context.WithoutCancel(ctx)
	stream, err := t.getFileStream(ctx, path, sha)
	if err != nil {
		return "", err
	}
	return stream.GetAudioInit(ctx, audio, quality)
}

func (t *Transcoder) GetAudioSegment(
	ctx context.Context,
	path string,
	audio uint32,
	quality AudioQuality,
	segment int32,
	client string,
	profileId *string,
	sessionId *string,
	sha string,
) (string, error) {
	ctx = context.WithoutCancel(ctx)
	stream, err := t.getFileStream(ctx, path, sha)
	if err != nil {
		return "", err
	}
	t.track(ClientInfo{
		client:    client,
		profileId: profileId,
		sessionId: sessionId,
		sha:       sha,
		path:      path,
		audio:     &AudioKey{audio, quality},
		ahead:     segment,
		vhead:     -1,
	})
	return stream.GetAudioSegment(ctx, audio, quality, segment)
}
