package src

import (
	"sync"
)

type Transcoder struct {
	// All file streams currently running, index is file path
	streams map[string]FileStream
	// Streams that are staring up
	preparing map[string]bool

	mutex   sync.RWMutex
	channel chan *FileStream
}

func (t *Transcoder) GetMaster(path string, client string) (string, error) {
	t.mutex.RLock()
	stream, ok := t.streams[path]
	preparing := t.preparing[path]
	t.mutex.RUnlock()

	if preparing {
		stream = *<- t.channel
	} else if !ok {
		t.mutex.Lock()
		t.preparing[path] = true
		t.mutex.Unlock()

		stream, err := NewFileStream(path)
		if err != nil {
			return "", err
		}

		t.mutex.Lock()
		t.streams[path] = *stream
		delete(t.preparing, path)
		t.mutex.Unlock()

		t.channel <- stream
	}
	return stream.GetMaster(), nil
}
