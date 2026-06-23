package src

import (
	"context"
	"os"
	"path"
)

type Transcoder struct {
	// All file streams currently running, index is sha
	streams         CMap[string, *FileStream]
	clientChan      chan ClientInfo
	tracker         *Tracker
	metadataService *MetadataService
}

func NewTranscoder(metadata *MetadataService) (*Transcoder, error) {
	out := Settings.Outpath
	os.MkdirAll(out, 0o755)
	dir, err := os.ReadDir(out)
	if err != nil {
		return nil, err
	}
	for _, d := range dir {
		err = os.RemoveAll(path.Join(out, d.Name()))
		if err != nil {
			return nil, err
		}
	}

	ret := &Transcoder{
		streams:         NewCMap[string, *FileStream](),
		clientChan:      make(chan ClientInfo, 10),
		metadataService: metadata,
	}
	ret.tracker = NewTracker(ret)
	return ret, nil
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

func (t *Transcoder) GetMaster(ctx context.Context, path string, client string, profileId *string, sessionId *string, sha string) (string, error) {
	ctx = context.WithoutCancel(ctx)
	stream, err := t.getFileStream(ctx, path, sha)
	if err != nil {
		return "", err
	}
	t.clientChan <- ClientInfo{
		client:    client,
		profileId: profileId,
		sessionId: sessionId,
		sha:       sha,
		path:      path,
		video:     nil,
		audio:     nil,
		vhead:     -1,
		ahead:     -1,
	}
	return stream.GetMaster(ctx, client), nil
}

func (t *Transcoder) GetVideoIndex(
	ctx context.Context,
	path string,
	video uint32,
	quality VideoQuality,
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
	t.clientChan <- ClientInfo{
		client:    client,
		profileId: profileId,
		sessionId: sessionId,
		sha:       sha,
		path:      path,
		video:     &VideoKey{video, quality},
		audio:     nil,
		vhead:     -1,
		ahead:     -1,
	}
	return stream.GetVideoIndex(ctx, video, quality, client)
}

func (t *Transcoder) GetAudioIndex(
	ctx context.Context,
	path string,
	audio uint32,
	quality AudioQuality,
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
	t.clientChan <- ClientInfo{
		client:    client,
		profileId: profileId,
		sessionId: sessionId,
		sha:       sha,
		path:      path,
		audio:     &AudioKey{audio, quality},
		vhead:     -1,
		ahead:     -1,
	}
	return stream.GetAudioIndex(ctx, audio, quality, client)
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
	t.clientChan <- ClientInfo{
		client:    client,
		profileId: profileId,
		sessionId: sessionId,
		sha:       sha,
		path:      path,
		video:     &VideoKey{video, quality},
		vhead:     segment,
		audio:     nil,
		ahead:     -1,
	}
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
	t.clientChan <- ClientInfo{
		client:    client,
		profileId: profileId,
		sessionId: sessionId,
		sha:       sha,
		path:      path,
		audio:     &AudioKey{audio, quality},
		ahead:     segment,
		vhead:     -1,
	}
	return stream.GetAudioSegment(ctx, audio, quality, segment)
}
