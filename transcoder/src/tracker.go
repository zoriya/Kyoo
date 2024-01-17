package src

type ClientInfo struct {
	client  string
	path    string
	quality *Quality
	audio   int32
	head    int32
}

type Tracker struct {
	clients    map[string]ClientInfo
	transcoder *Transcoder
}

func NewTracker(t *Transcoder) *Tracker {
	ret := &Tracker{
		clients:    make(map[string]ClientInfo),
		transcoder: t,
	}
	go ret.start()
	return ret
}

func (t *Tracker) start() {
	for {
		info := <-t.transcoder.clientChan
		old, ok := t.clients[info.client]
		if ok && old.path == info.path {
			// First fixup the info. Most routes ruturn partial infos
			if info.quality == nil {
				info.quality = old.quality
			}
			if info.audio == -1 {
				info.audio = old.audio
			}
			if info.head == -1 {
				info.head = old.head
			}

			if old.audio != info.audio && old.audio != -1 {
				t.KillAudioIfDead(old.path, old.audio)
			}
			if old.quality != info.quality && old.quality != nil {
				t.KillQualityIfDead(old.path, *old.quality)
			}
		} else if ok {
			t.KillStreamIfDead(old.path)
		}
		t.clients[info.client] = info
	}
}

func (t *Tracker) KillStreamIfDead(path string) {
	for _, stream := range t.clients {
		if stream.path == path {
			return
		}
	}
	t.transcoder.mutex.Lock()
	defer t.transcoder.mutex.Unlock()
	t.transcoder.streams[path].Destroy()
	delete(t.transcoder.streams, path)
}

func (t *Tracker) KillAudioIfDead(path string, audio int32) {
	for _, stream := range t.clients {
		if stream.path == path && stream.audio == audio {
			return
		}
	}
	t.transcoder.mutex.RLock()
	stream := t.transcoder.streams[path]
	t.transcoder.mutex.RUnlock()

	stream.alock.RLock()
	defer stream.alock.RUnlock()
	stream.audios[audio].Kill()
}

func (t *Tracker) KillQualityIfDead(path string, quality Quality) {
	for _, stream := range t.clients {
		if stream.path == path && stream.quality != nil && *stream.quality == quality {
			return
		}
	}
	t.transcoder.mutex.RLock()
	stream := t.transcoder.streams[path]
	t.transcoder.mutex.RUnlock()

	stream.vlock.RLock()
	defer stream.vlock.RUnlock()
	stream.streams[quality].Kill()
}
