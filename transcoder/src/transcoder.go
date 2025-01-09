package src

import (
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

func (t *Transcoder) getFileStream(path string, sha string) (*FileStream, error) {
	ret, _ := t.streams.GetOrCreate(sha, func() *FileStream {
		return t.newFileStream(path, sha)
	})
	ret.ready.Wait()
	if ret.err != nil {
		t.streams.Remove(path)
		return nil, ret.err
	}
	return ret, nil
}

func (t *Transcoder) GetMaster(path string, client string, sha string) (string, error) {
	stream, err := t.getFileStream(path, sha)
	if err != nil {
		return "", err
	}
	t.clientChan <- ClientInfo{
		client: client,
		sha:    sha,
		path:   path,
		video:  nil,
		audio:  nil,
		vhead:  -1,
		ahead:  -1,
	}
	return stream.GetMaster(), nil
}

func (t *Transcoder) GetVideoIndex(
	path string,
	video uint32,
	quality Quality,
	client string,
	sha string,
) (string, error) {
	stream, err := t.getFileStream(path, sha)
	if err != nil {
		return "", err
	}
	t.clientChan <- ClientInfo{
		client: client,
		sha:    sha,
		path:   path,
		video:  &VideoKey{video, quality},
		audio:  nil,
		vhead:  -1,
		ahead:  -1,
	}
	return stream.GetVideoIndex(video, quality)
}

func (t *Transcoder) GetAudioIndex(
	path string,
	audio uint32,
	client string,
	sha string,
) (string, error) {
	stream, err := t.getFileStream(path, sha)
	if err != nil {
		return "", err
	}
	t.clientChan <- ClientInfo{
		client: client,
		sha:    sha,
		path:   path,
		audio:  &audio,
		vhead:  -1,
		ahead:  -1,
	}
	return stream.GetAudioIndex(audio)
}

func (t *Transcoder) GetVideoSegment(
	path string,
	video uint32,
	quality Quality,
	segment int32,
	client string,
	sha string,
) (string, error) {
	stream, err := t.getFileStream(path, sha)
	if err != nil {
		return "", err
	}
	t.clientChan <- ClientInfo{
		client: client,
		sha:    sha,
		path:   path,
		video:  &VideoKey{video, quality},
		vhead:  segment,
		audio:  nil,
		ahead:  -1,
	}
	return stream.GetVideoSegment(video, quality, segment)
}

func (t *Transcoder) GetAudioSegment(
	path string,
	audio uint32,
	segment int32,
	client string,
	sha string,
) (string, error) {
	stream, err := t.getFileStream(path, sha)
	if err != nil {
		return "", err
	}
	t.clientChan <- ClientInfo{
		client: client,
		sha:    sha,
		path:   path,
		audio:  &audio,
		ahead:  segment,
		vhead:  -1,
	}
	return stream.GetAudioSegment(audio, segment)
}
