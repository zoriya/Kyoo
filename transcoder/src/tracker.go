package src

import (
	"log"
	"time"
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
	visitDate  map[string]time.Time
	transcoder *Transcoder
}

func NewTracker(t *Transcoder) *Tracker {
	ret := &Tracker{
		clients:    make(map[string]ClientInfo),
		visitDate:  make(map[string]time.Time),
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
	inactive_time := 1 * time.Hour
	timer := time.After(inactive_time)
	for {
		select {
		case info, ok := <-t.transcoder.clientChan:
			if !ok {
				return
			}

			old, ok := t.clients[info.client]
			// First fixup the info. Most routes ruturn partial infos
			if ok && old.path == info.path {
				if info.quality == nil {
					info.quality = old.quality
				}
				if info.audio == -1 {
					info.audio = old.audio
				}
				if info.head == -1 {
					info.head = old.head
				}
			}

			t.clients[info.client] = info
			t.visitDate[info.client] = time.Now()

			// now that the new info is stored and fixed, kill old streams
			if ok && old.path == info.path {
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

		case <-timer:
			timer = time.After(inactive_time)
			// Purge old clients
			for client, date := range t.visitDate {
				if time.Since(date) < inactive_time {
					continue
				}

				info := t.clients[client]

				if !t.KillStreamIfDead(info.path) {
					audio_cleanup := info.audio != -1 && t.KillAudioIfDead(info.path, info.audio)
					video_cleanup := info.quality != nil && t.KillQualityIfDead(info.path, *info.quality)
					if !audio_cleanup || !video_cleanup {
						t.KillOrphanedHeads(info.path, info.quality, info.audio)
					}
				}

				delete(t.clients, client)
				delete(t.visitDate, client)
			}
		}
	}
}

func (t *Tracker) KillStreamIfDead(path string) bool {
	for _, stream := range t.clients {
		if stream.path == path {
			return false
		}
	}
	log.Printf("Nobody is watching %s. Killing it", path)
	t.transcoder.mutex.Lock()
	defer t.transcoder.mutex.Unlock()
	t.transcoder.streams[path].Destroy()
	delete(t.transcoder.streams, path)
	return true
}

func (t *Tracker) KillAudioIfDead(path string, audio int32) bool {
	for _, stream := range t.clients {
		if stream.path == path && stream.audio == audio {
			return false
		}
	}
	log.Printf("Nobody is listening audio %d of %s. Killing it", audio, path)
	t.transcoder.mutex.Lock()
	stream := t.transcoder.streams[path]
	t.transcoder.mutex.Unlock()

	stream.alock.Lock()
	defer stream.alock.Unlock()
	stream.audios[audio].Kill()
	return true
}

func (t *Tracker) KillQualityIfDead(path string, quality Quality) bool {
	for _, stream := range t.clients {
		if stream.path == path && stream.quality != nil && *stream.quality == quality {
			return false
		}
	}
	log.Printf("Nobody is watching quality %s of %s. Killing it", quality, path)
	t.transcoder.mutex.Lock()
	stream := t.transcoder.streams[path]
	t.transcoder.mutex.Unlock()

	stream.vlock.Lock()
	defer stream.vlock.Unlock()
	stream.streams[quality].Kill()
	return true
}

func (t *Tracker) KillOrphanedHeads(path string, quality *Quality, audio int32) {
	t.transcoder.mutex.Lock()
	stream := t.transcoder.streams[path]
	t.transcoder.mutex.Unlock()

	if quality != nil {
		stream.vlock.Lock()
		vstream := stream.streams[*quality]
		stream.vlock.Unlock()

		t.killOrphanedeheads(&vstream.Stream)
	}
	if audio != -1 {
		stream.alock.Lock()
		astream := stream.audios[audio]
		stream.alock.Unlock()

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
