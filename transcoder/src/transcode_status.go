package src

import (
	"sort"
)

type StreamStatus struct {
	Path     string            `json:"path"`
	Sha      string            `json:"sha"`
	Duration float64           `json:"duration"`
	Videos   []TranscodeStatus `json:"videos"`
	Audios   []TranscodeStatus `json:"audios"`
	Viewers  []ClientStatus    `json:"viewers"`
}

type TranscodeStatus struct {
	Index   uint32      `json:"index"`
	Quality string      `json:"quality"`
	Heads   []HeadRange `json:"heads"`
}

type HeadRange struct {
	Start     float64 `json:"start"`
	End       float64 `json:"end"`
	StartHead int32   `json:"startHead"`
	EndHead   int32   `json:"endHead"`
	IsRunning bool    `json:"isRunning"`
}

type ViewerTrack struct {
	Index   uint32 `json:"index"`
	Quality string `json:"quality"`
	Head    int32  `json:"head"`
}

type ClientStatus struct {
	ClientId  string       `json:"clientId"`
	ProfileId *string      `json:"profileId"`
	SessionId *string      `json:"sessionId"`
	Video     *ViewerTrack `json:"video"`
	Audio     *ViewerTrack `json:"audio"`
}

func (t *Transcoder) ListRunningStreams() []StreamStatus {
	clients := t.tracker.SnapshotClients()

	t.streams.lock.RLock()
	streams := make(map[string]*FileStream, len(t.streams.data))
	for sha, stream := range t.streams.data {
		streams[sha] = stream
	}
	t.streams.lock.RUnlock()

	clientBySha := make(map[string][]ClientInfo)
	for _, client := range clients {
		clientBySha[client.sha] = append(clientBySha[client.sha], client)
	}

	ret := make([]StreamStatus, 0, len(streams))
	for sha, stream := range streams {
		if stream == nil || stream.Info == nil {
			continue
		}

		status := StreamStatus{
			Path:     stream.Info.Path,
			Sha:      sha,
			Duration: stream.Info.Duration,
			Videos:   listVideoStatuses(stream),
			Audios:   listAudioStatuses(stream),
			Viewers:  listClientStatuses(stream, clientBySha[sha]),
		}
		if len(status.Videos) == 0 && len(status.Audios) == 0 && len(status.Viewers) == 0 {
			continue
		}
		ret = append(ret, status)
	}

	sort.Slice(ret, func(i int, j int) bool {
		return ret[i].Path < ret[j].Path
	})
	return ret
}

func listVideoStatuses(stream *FileStream) []TranscodeStatus {
	stream.videos.lock.RLock()
	ret := make([]TranscodeStatus, 0, len(stream.videos.data))
	for key, video := range stream.videos.data {
		if video == nil {
			continue
		}
		ret = append(ret, TranscodeStatus{
			Index:   key.idx,
			Quality: string(key.quality),
			Heads:   listHeadRanges(stream, &video.Stream, true, key.idx),
		})
	}
	stream.videos.lock.RUnlock()

	sort.Slice(ret, func(i int, j int) bool {
		if ret[i].Index == ret[j].Index {
			return ret[i].Quality < ret[j].Quality
		}
		return ret[i].Index < ret[j].Index
	})
	return ret
}

func listAudioStatuses(stream *FileStream) []TranscodeStatus {
	stream.audios.lock.RLock()
	ret := make([]TranscodeStatus, 0, len(stream.audios.data))
	for key, audio := range stream.audios.data {
		if audio == nil {
			continue
		}
		ret = append(ret, TranscodeStatus{
			Index:   key.idx,
			Quality: string(key.quality),
			Heads:   listHeadRanges(stream, &audio.Stream, false, key.idx),
		})
	}
	stream.audios.lock.RUnlock()

	sort.Slice(ret, func(i int, j int) bool {
		if ret[i].Index == ret[j].Index {
			return ret[i].Quality < ret[j].Quality
		}
		return ret[i].Index < ret[j].Index
	})
	return ret
}

func listClientStatuses(stream *FileStream, clients []ClientInfo) []ClientStatus {
	ret := make([]ClientStatus, 0, len(clients))
	for _, client := range clients {
		var video *ViewerTrack
		if client.video != nil {
			video = &ViewerTrack{
				Index:   client.video.idx,
				Quality: string(client.video.quality),
				Head:    client.vhead,
			}
		}

		var audio *ViewerTrack
		if client.audio != nil {
			audio = &ViewerTrack{
				Index:   client.audio.idx,
				Quality: string(client.audio.quality),
				Head:    client.ahead,
			}
		}

		ret = append(ret, ClientStatus{
			ClientId:  client.client,
			ProfileId: client.profileId,
			SessionId: client.sessionId,
			Video:     video,
			Audio:     audio,
		})
	}

	sort.Slice(ret, func(i int, j int) bool {
		return ret[i].ClientId < ret[j].ClientId
	})
	return ret
}

func listHeadRanges(file *FileStream, stream *Stream, isVideo bool, index uint32) []HeadRange {
	stream.lock.RLock()
	defer stream.lock.RUnlock()

	ret := make([]HeadRange, 0, len(stream.heads))
	for _, head := range stream.heads {
		if head == DeletedHead {
			continue
		}

		end := stream.file.Info.Duration
		length, _ := stream.keyframes.Length()
		if head.end-1 < length {
			end = stream.keyframes.Get(head.end - 1)
		}

		ret = append(ret, HeadRange{
			Start:     stream.keyframes.Get(head.segment),
			End:       end,
			StartHead: head.segment,
			EndHead:   head.end,
			IsRunning: head.command != nil && head.command.ProcessState == nil,
		})
	}

	for i := int32(0); i < int32(len(stream.segments)); i++ {
		if !stream.isSegmentReady(i) {
			continue
		}

		start := i
		for i < int32(len(stream.segments)) && stream.isSegmentReady(i) {
			i++
		}
		end := i

		ret = append(ret, HeadRange{
			Start:     stream.keyframes.Get(start),
			End:       stream.keyframes.Get(end - 1),
			StartHead: start,
			EndHead:   end,
			IsRunning: false,
		})
		i--
	}

	sort.Slice(ret, func(i int, j int) bool {
		if ret[i].StartHead == ret[j].StartHead {
			return ret[i].EndHead < ret[j].EndHead
		}
		return ret[i].StartHead < ret[j].StartHead
	})
	return ret
}
