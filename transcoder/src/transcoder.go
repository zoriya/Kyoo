package src

import (
	"errors"
	"log"
	"os"
	"path"
	"sync"
)

type Transcoder struct {
	// All file streams currently running, index is file path
	streams map[string]*FileStream
	// Streams that are staring up
	preparing  map[string]chan *FileStream
	mutex      sync.Mutex
	clientChan chan ClientInfo
	tracker    *Tracker
}

func NewTranscoder() (*Transcoder, error) {
	out := GetOutPath()
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
		streams:    make(map[string]*FileStream),
		preparing:  make(map[string]chan *FileStream),
		clientChan: make(chan ClientInfo, 10),
	}
	ret.tracker = NewTracker(ret)
	return ret, nil
}

func (t *Transcoder) getFileStream(path string) (*FileStream, error) {
	t.mutex.Lock()
	stream, ok := t.streams[path]
	channel, preparing := t.preparing[path]
	if !preparing && !ok {
		channel = make(chan *FileStream, 1)
		t.preparing[path] = channel
	}
	t.mutex.Unlock()

	if preparing {
		stream = <-channel
		if stream == nil {
			return nil, errors.New("could not transcode file. Try again later")
		}
	} else if !ok {
		var err error
		stream, err = NewFileStream(path)
		log.Printf("Stream created for %s", path)
		if err != nil {
			t.mutex.Lock()
			delete(t.preparing, path)
			t.mutex.Unlock()
			channel <- nil

			return nil, err
		}

		t.mutex.Lock()
		t.streams[path] = stream
		delete(t.preparing, path)
		t.mutex.Unlock()

		channel <- stream
	}
	return stream, nil
}

func (t *Transcoder) GetMaster(path string, client string) (string, error) {
	stream, err := t.getFileStream(path)
	if err != nil {
		return "", err
	}
	t.clientChan <- ClientInfo{
		client:  client,
		path:    path,
		quality: nil,
		audio:   -1,
		head:    -1,
	}
	return stream.GetMaster(), nil
}

func (t *Transcoder) GetVideoIndex(path string, quality Quality, client string) (string, error) {
	stream, err := t.getFileStream(path)
	if err != nil {
		return "", err
	}
	t.clientChan <- ClientInfo{
		client:  client,
		path:    path,
		quality: &quality,
		audio:   -1,
		head:    -1,
	}
	return stream.GetVideoIndex(quality)
}

func (t *Transcoder) GetAudioIndex(path string, audio int32, client string) (string, error) {
	stream, err := t.getFileStream(path)
	if err != nil {
		return "", err
	}
	t.clientChan <- ClientInfo{
		client: client,
		path:   path,
		audio:  audio,
		head:   -1,
	}
	return stream.GetAudioIndex(audio)
}

func (t *Transcoder) GetVideoSegment(
	path string,
	quality Quality,
	segment int32,
	client string,
) (string, error) {
	stream, err := t.getFileStream(path)
	if err != nil {
		return "", err
	}
	t.clientChan <- ClientInfo{
		client:  client,
		path:    path,
		quality: &quality,
		audio:   -1,
		head:    segment,
	}
	return stream.GetVideoSegment(quality, segment)
}

func (t *Transcoder) GetAudioSegment(
	path string,
	audio int32,
	segment int32,
	client string,
) (string, error) {
	stream, err := t.getFileStream(path)
	if err != nil {
		return "", err
	}
	t.clientChan <- ClientInfo{
		client: client,
		path:   path,
		audio:  audio,
		head:   segment,
	}
	return stream.GetAudioSegment(audio, segment)
}
