package src

import (
	"errors"
	"log"
	"sync"
)

type Transcoder struct {
	// All file streams currently running, index is file path
	streams map[string]FileStream
	// Streams that are staring up
	preparing map[string]chan *FileStream
	mutex     sync.RWMutex
}

func NewTranscoder() *Transcoder {
	return &Transcoder{
		streams:   make(map[string]FileStream),
		preparing: make(map[string]chan *FileStream),
	}
}

func (t *Transcoder) GetMaster(path string, client string) (string, error) {
	t.mutex.RLock()
	stream, ok := t.streams[path]
	channel, preparing := t.preparing[path]
	t.mutex.RUnlock()

	if preparing {
		pstream := <-channel
		if pstream == nil {
			return "", errors.New("could not transcode file. Try again later")
		}
		stream = *pstream
	} else if !ok {
		t.mutex.Lock()
		channel = make(chan *FileStream, 1)
		t.preparing[path] = channel
		t.cleanUnused()
		t.mutex.Unlock()

		newstream, err := NewFileStream(path)
		log.Printf("Stream created for %s", path)
		if err != nil {
			t.mutex.Lock()
			delete(t.preparing, path)
			t.mutex.Unlock()
			channel <- nil

			return "", err
		}

		t.mutex.Lock()
		t.streams[path] = *newstream
		stream = t.streams[path]
		delete(t.preparing, path)
		t.mutex.Unlock()

		channel <- &stream
	}

	return stream.GetMaster(), nil
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
