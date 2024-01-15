package src

import (
	"errors"
	"log"
	"sync"
)

type Transcoder struct {
	// All file streams currently running, index is file path
	streams map[string]*FileStream
	// Streams that are staring up
	preparing map[string]chan *FileStream
	mutex     sync.RWMutex
}

func NewTranscoder() *Transcoder {
	return &Transcoder{
		streams:   make(map[string]*FileStream),
		preparing: make(map[string]chan *FileStream),
	}
}

func (t *Transcoder) getFileStream(path string) (*FileStream, error) {
	t.mutex.RLock()
	stream, ok := t.streams[path]
	channel, preparing := t.preparing[path]
	t.mutex.RUnlock()

	if preparing {
		stream = <-channel
		if stream == nil {
			return nil, errors.New("could not transcode file. Try again later")
		}
	} else if !ok {
		t.mutex.Lock()
		channel = make(chan *FileStream, 1)
		t.preparing[path] = channel
		t.cleanUnused()
		t.mutex.Unlock()

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

// This method assume the lock is already taken.
func (t *Transcoder) cleanUnused() {
	for path, stream := range t.streams {
		if !stream.IsDead() {
			continue
		}
		stream.Destroy()
		delete(t.streams, path)
	}
}

func (t *Transcoder) GetMaster(path string, client string) (string, error) {
	stream, err := t.getFileStream(path)
	if err != nil {
		return "", err
	}
	return stream.GetMaster(), nil
}

func (t *Transcoder) GetVideoIndex(path string, quality Quality, client string) (string, error) {
	stream, err := t.getFileStream(path)
	if err != nil {
		return "", err
	}
	return stream.GetVideoIndex(quality, client)
}

func (t *Transcoder) GetAudioIndex(path string, audio int32, client string) (string, error) {
	stream, err := t.getFileStream(path)
	if err != nil {
		return "", err
	}
	return stream.GetAudioIndex(audio, client)
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
	return stream.GetVideoSegment(quality, segment, client)
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
	return stream.GetAudioSegment(audio, segment, client)
}
