package src

import (
	"log"
	"time"
)

type ClientInfo struct {
	client string
	sha    string
	path   string
	video  *VideoKey
	audio  *uint32
	vhead  int32
	ahead  int32
}

type Tracker struct {
	// key: client_id
	clients map[string]ClientInfo
	// key: client_id
	visitDate map[string]time.Time
	// key: sha
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
			if ok && old.sha == info.sha {
				if info.video == nil {
					info.video = old.video
				}
				if info.audio == nil {
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
			t.lastUsage[info.sha] = time.Now()

			// now that the new info is stored and fixed, kill old streams
			if ok && old.sha == info.sha {
				if old.audio != nil && (info.audio == nil || *info.audio != *old.audio) {
					t.KillAudioIfDead(old.sha, old.path, *old.audio)
				}
				if old.video != nil && (info.video == nil || *info.video != *old.video) {
					t.KillVideoIfDead(old.sha, old.path, *old.video)
				}
				if old.vhead != -1 && Abs(info.vhead-old.vhead) > 100 {
					t.KillOrphanedHeads(old.sha, old.video, nil)
				}
				if old.ahead != -1 && Abs(info.ahead-old.ahead) > 100 {
					t.KillOrphanedHeads(old.sha, nil, old.audio)
				}
			} else if ok {
				t.KillStreamIfDead(old.sha, old.path)
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

				if !t.KillStreamIfDead(info.sha, info.path) {
					audio_cleanup := info.audio != nil && t.KillAudioIfDead(info.sha, info.path, *info.audio)
					video_cleanup := info.video != nil && t.KillVideoIfDead(info.sha, info.path, *info.video)
					if !audio_cleanup || !video_cleanup {
						t.KillOrphanedHeads(info.sha, info.video, info.audio)
					}
				}
			}
		case path := <-t.deletedStream:
			t.DestroyStreamIfOld(path)
		}
	}
}

func (t *Tracker) KillStreamIfDead(sha string, path string) bool {
	for _, stream := range t.clients {
		if stream.sha == sha {
			return false
		}
	}
	log.Printf("Nobody is watching %s. Killing it", path)

	stream, ok := t.transcoder.streams.Get(sha)
	if !ok {
		return false
	}
	stream.Kill()
	go func() {
		time.Sleep(4 * time.Hour)
		t.deletedStream <- sha
	}()
	return true
}

func (t *Tracker) DestroyStreamIfOld(sha string) {
	if time.Since(t.lastUsage[sha]) < 4*time.Hour {
		return
	}
	stream, ok := t.transcoder.streams.GetAndRemove(sha)
	if !ok {
		return
	}
	stream.Destroy()
}

func (t *Tracker) KillAudioIfDead(sha string, path string, audio uint32) bool {
	for _, stream := range t.clients {
		if stream.sha == sha && stream.audio != nil && *stream.audio == audio {
			return false
		}
	}
	log.Printf("Nobody is listening audio %d of %s. Killing it", audio, path)

	stream, ok := t.transcoder.streams.Get(sha)
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

func (t *Tracker) KillVideoIfDead(sha string, path string, video VideoKey) bool {
	for _, stream := range t.clients {
		if stream.sha == sha && stream.video != nil && *stream.video == video {
			return false
		}
	}
	log.Printf("Nobody is watching %s video %d quality %s. Killing it", path, video.idx, video.quality)

	stream, ok := t.transcoder.streams.Get(sha)
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

func (t *Tracker) KillOrphanedHeads(sha string, video *VideoKey, audio *uint32) {
	stream, ok := t.transcoder.streams.Get(sha)
	if !ok {
		return
	}

	if video != nil {
		vstream, vok := stream.videos.Get(*video)
		if vok {
			t.killOrphanedeheads(&vstream.Stream, true)
		}
	}
	if audio != nil {
		astream, aok := stream.audios.Get(*audio)
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
			ihead := info.ahead
			if is_video {
				ihead = info.vhead
			}
			distance = min(Abs(ihead-head.segment), distance)
		}
		if distance > 20 {
			log.Printf("Killing orphaned head %s %d", stream.file.Info.Path, encoder_id)
			stream.KillHead(encoder_id)
		}
	}
}
