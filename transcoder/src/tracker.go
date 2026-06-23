package src

import (
	"context"
	"fmt"
	"log/slog"
	"runtime/debug"
	"time"
)

type ClientInfo struct {
	client    string
	profileId *string
	sessionId *string
	sha       string
	path      string
	video     *VideoKey
	audio     *AudioKey
	vhead     int32
	ahead     int32
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
	snapshotReq   chan chan map[string]ClientInfo
}

func NewTracker(t *Transcoder) *Tracker {
	ret := &Tracker{
		clients:       make(map[string]ClientInfo),
		visitDate:     make(map[string]time.Time),
		lastUsage:     make(map[string]time.Time),
		deletedStream: make(chan string),
		snapshotReq:   make(chan chan map[string]ClientInfo),
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
	// The tracker is a single goroutine that everything else depends on for
	// cleanup; if it dies the clientChan stops draining and requests eventually
	// block. Never let a panic kill it for good - log and restart the loop.
	defer func() {
		if r := recover(); r != nil {
			slog.Error("tracker goroutine panicked; restarting",
				"panic", fmt.Sprintf("%v", r), "stack", string(debug.Stack()))
			go t.start()
		}
	}()

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
				if info.profileId == nil {
					info.profileId = old.profileId
				}
				if info.sessionId == nil {
					info.sessionId = old.sessionId
				}
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
			stale := make([]ClientInfo, 0)
			for client, date := range t.visitDate {
				if time.Since(date) < inactive_time {
					continue
				}

				info := t.clients[client]
				delete(t.clients, client)
				delete(t.visitDate, client)
				stale = append(stale, info)
			}

			for _, info := range stale {
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
		case reply := <-t.snapshotReq:
			reply <- t.cloneClients()
		}
	}
}

func (t *Tracker) KillStreamIfDead(sha string, path string) bool {
	ctx := context.WithoutCancel(context.Background())
	for _, stream := range t.clients {
		if stream.sha == sha {
			return false
		}
	}
	slog.InfoContext(ctx, "nobody is watching stream, killing it", "path", path)

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
	lastUsage, ok := t.lastUsage[sha]
	if !ok {
		return
	}
	if time.Since(lastUsage) < 4*time.Hour {
		return
	}
	stream, ok := t.transcoder.streams.GetAndRemove(sha)
	if !ok {
		return
	}
	stream.Destroy(context.WithoutCancel(context.Background()))
}

func (t *Tracker) KillAudioIfDead(sha string, path string, audio AudioKey) bool {
	ctx := context.WithoutCancel(context.Background())
	for _, stream := range t.clients {
		if stream.sha == sha && stream.audio != nil && *stream.audio == audio {
			return false
		}
	}
	slog.InfoContext(ctx, "nobody is listening audio, killing it", "audioIdx", audio.idx, "path", path)

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
	ctx := context.WithoutCancel(context.Background())
	for _, stream := range t.clients {
		if stream.sha == sha && stream.video != nil && *stream.video == video {
			return false
		}
	}
	slog.InfoContext(ctx, "nobody is watching video quality, killing it", "path", path, "videoIdx", video.idx, "quality", video.quality)

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

func (t *Tracker) KillOrphanedHeads(sha string, video *VideoKey, audio *AudioKey) {
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
	ctx := context.WithoutCancel(context.Background())
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
			slog.InfoContext(ctx, "killing orphaned head", "path", stream.file.Info.Path, "encoderId", encoder_id)
			stream.KillHead(encoder_id)
		}
	}
}

func (t *Tracker) SnapshotClients() map[string]ClientInfo {
	ret := make(chan map[string]ClientInfo)
	t.snapshotReq <- ret
	return <-ret
}

func (t *Tracker) cloneClients() map[string]ClientInfo {
	out := make(map[string]ClientInfo, len(t.clients))
	for clientId, info := range t.clients {
		out[clientId] = info
	}
	return out
}
