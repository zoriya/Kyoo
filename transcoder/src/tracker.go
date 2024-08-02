package src

import (
	"log"
	"time"
)

type ClientInfo struct {
	client string
	path   string
	video  *VideoKey
	audio  int32
	vhead  int32
	ahead  int32
}

type Tracker struct {
	// key: client_id
	clients map[string]ClientInfo
	// key: client_id
	visitDate map[string]time.Time
	// key: path
	lastUsage     map[string]time.Time
	transcoder    *Transcoder
	deletedStream chan string
}

func NewTracker(t *Transcoder) *Tracker {
	ret := &Tracker{
		clients:       make(map[string]ClientInfo),
		visitDate:     make(map[string]time.Time),
		lastUsage:     make(map[string]time.Time),
		deletedStream: make(chan string),
		transcoder:    t,
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
				if info.video == nil {
					info.video = old.video
				}
				if info.audio == -1 {
					info.audio = old.audio
				}
				if info.vhead == -1 {
					info.vhead = old.vhead
				}
				if info.ahead == -1 {
					info.ahead = old.ahead
				}
			}

			t.clients[info.client] = info
			t.visitDate[info.client] = time.Now()
			t.lastUsage[info.path] = time.Now()

			// now that the new info is stored and fixed, kill old streams
			if ok && old.path == info.path {
				if old.audio != info.audio && old.audio != -1 {
					t.KillAudioIfDead(old.path, old.audio)
				}
				if old.video != info.video && old.video != nil {
					t.KillVideoIfDead(old.path, *old.video)
				}
				if old.vhead != -1 && Abs(info.vhead-old.vhead) > 100 {
					t.KillOrphanedHeads(old.path, old.video, -1)
				}
				if old.ahead != -1 && Abs(info.ahead-old.ahead) > 100 {
					t.KillOrphanedHeads(old.path, nil, old.audio)
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
				delete(t.clients, client)
				delete(t.visitDate, client)

				if !t.KillStreamIfDead(info.path) {
					audio_cleanup := info.audio != -1 && t.KillAudioIfDead(info.path, info.audio)
					video_cleanup := info.video != nil && t.KillVideoIfDead(info.path, *info.video)
					if !audio_cleanup || !video_cleanup {
						t.KillOrphanedHeads(info.path, info.video, info.audio)
					}
				}
			}
		case path := <-t.deletedStream:
			t.DestroyStreamIfOld(path)
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

	stream, ok := t.transcoder.streams.Get(path)
	if !ok {
		return false
	}
	stream.Kill()
	go func() {
		time.Sleep(4 * time.Hour)
		t.deletedStream <- path
	}()
	return true
}

func (t *Tracker) DestroyStreamIfOld(path string) {
	if time.Since(t.lastUsage[path]) < 4*time.Hour {
		return
	}
	stream, ok := t.transcoder.streams.GetAndRemove(path)
	if !ok {
		return
	}
	stream.Destroy()
}

func (t *Tracker) KillAudioIfDead(path string, audio int32) bool {
	for _, stream := range t.clients {
		if stream.path == path && stream.audio == audio {
			return false
		}
	}
	log.Printf("Nobody is listening audio %d of %s. Killing it", audio, path)

	stream, ok := t.transcoder.streams.Get(path)
	if !ok {
		return false
	}
	astream, aok := stream.audios.Get(audio)
	if !aok {
		return false
	}
	astream.Kill()
	return true
}

func (t *Tracker) KillVideoIfDead(path string, video VideoKey) bool {
	for _, stream := range t.clients {
		if stream.path == path && stream.video != nil && *stream.video == video {
			return false
		}
	}
	log.Printf("Nobody is watching %s video %d quality %s. Killing it", path, video.idx, video.quality)

	stream, ok := t.transcoder.streams.Get(path)
	if !ok {
		return false
	}
	vstream, vok := stream.videos.Get(video)
	if !vok {
		return false
	}
	vstream.Kill()
	return true
}

func (t *Tracker) KillOrphanedHeads(path string, video *VideoKey, audio int32) {
	stream, ok := t.transcoder.streams.Get(path)
	if !ok {
		return
	}

	if video != nil {
		vstream, vok := stream.videos.Get(*video)
		if vok {
			t.killOrphanedeheads(&vstream.Stream, true)
		}
	}
	if audio != -1 {
		astream, aok := stream.audios.Get(audio)
		if aok {
			t.killOrphanedeheads(&astream.Stream, false)
		}
	}
}

func (t *Tracker) killOrphanedeheads(stream *Stream, is_video bool) {
	stream.lock.Lock()
	defer stream.lock.Unlock()

	for encoder_id, head := range stream.heads {
		if head == DeletedHead {
			continue
		}

		distance := int32(99999)
		for _, info := range t.clients {
			ihead := info.vhead
			if is_video {
				ihead = info.ahead
			}
			distance = min(Abs(ihead-head.segment), distance)
		}
		if distance > 20 {
			log.Printf("Killing orphaned head %s %d", stream.file.Info.Path, encoder_id)
			stream.KillHead(encoder_id)
		}
	}
}
