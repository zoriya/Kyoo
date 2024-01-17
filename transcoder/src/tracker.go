package src

import (
	"log"
)

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

func Abs(x int32) int32 {
	if x < 0 {
		return -x
	}
	return x
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
			if old.head != -1 && Abs(info.head-old.head) > 100 {
				t.KillOrphanedHeads(old.path, old.quality, old.audio)
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

func (t *Tracker) KillOrphanedHeads(path string, quality *Quality, audio int32) {
	t.transcoder.mutex.RLock()
	stream := t.transcoder.streams[path]
	t.transcoder.mutex.RUnlock()

	if quality != nil {
		stream.vlock.RLock()
		vstream := stream.streams[*quality]
		stream.vlock.RUnlock()

		t.killOrphanedeheads(&vstream.Stream)
	}
	if audio != -1 {
		stream.alock.RLock()
		astream := stream.audios[audio]
		stream.alock.RUnlock()

		t.killOrphanedeheads(&astream.Stream)
	}
}

func (t *Tracker) killOrphanedeheads(stream *Stream) {
	stream.lock.Lock()
	defer stream.lock.Unlock()

	for encoder_id, head := range stream.heads {
		distance := int32(99999)
		for _, info := range t.clients {
			if info.head == -1 {
				continue
			}
			distance = min(Abs(info.head-head), distance)
		}
		if distance > 100 {
			log.Printf("Killing orphaned head %s %d", stream.file.Path, encoder_id)
			stream.KillHead(encoder_id)
		}
	}
}
