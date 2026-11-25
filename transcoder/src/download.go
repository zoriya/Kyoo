package src

import (
	"bufio"
	"cmp"
	"context"
	"crypto/rand"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/zoriya/kyoo/transcoder/src/exec"
	"github.com/zoriya/kyoo/transcoder/src/utils"
	"golang.org/x/text/language"
)

type DownloadStatus string

const (
	DownloadPending   DownloadStatus = "pending"
	DownloadPreparing DownloadStatus = "preparing"
	DownloadReady     DownloadStatus = "ready"
	DownloadFailed    DownloadStatus = "failed"
	DownloadCancelled DownloadStatus = "cancelled"
)

type DownloadInfo struct {
	Status DownloadStatus `json:"status"`
	// Percent of the file prepared (between 0 and 100).
	Progress float64 `json:"progress"`
	// Size of the file in bytes, 0 until the file is ready.
	Size int64 `json:"size"`
	// Seconds to wait before asking again, 0 once the file is ready.
	RetryAfter int `json:"retryAfter"`
	// Why the preparation failed (ffmpeg's output for example).
	Error string `json:"error,omitempty"`
}

type DownloadKey struct {
	sha     string
	quality VideoQuality
}

type Download struct {
	Path      string
	Name      string
	lock      sync.Mutex
	info      DownloadInfo
	lastUsage time.Time
	cancel    context.CancelFunc
	// ids of the clients waiting for it, it's cancelled once none are left
	ids map[string]struct{}
}

func (dl *Download) Info() DownloadInfo {
	dl.lock.Lock()
	defer dl.lock.Unlock()
	dl.lastUsage = time.Now()
	ret := dl.info
	switch ret.Status {
	case DownloadPending:
		ret.RetryAfter = 10
	case DownloadPreparing:
		ret.RetryAfter = 2
	}
	return ret
}

func (t *Transcoder) GetDownload(sha string, quality VideoQuality) *Download {
	dl, _ := t.downloads.Get(DownloadKey{sha, quality})
	return dl
}

func (t *Transcoder) StartDownload(
	ctx context.Context,
	path string,
	sha string,
	quality VideoQuality,
	id string,
) (*Download, error) {
	ctx = context.WithoutCancel(ctx)
	dl, created := t.downloads.GetOrCreate(DownloadKey{sha, quality}, func() *Download {
		return &Download{
			Path:      filepath.Join(Settings.DownloadOutpath, fmt.Sprintf("%s-%s.mkv", sha, quality)),
			Name:      strings.TrimSuffix(filepath.Base(path), filepath.Ext(path)) + ".mkv",
			info:      DownloadInfo{Status: DownloadPending},
			lastUsage: time.Now(),
			ids:       make(map[string]struct{}),
		}
	})

	dl.lock.Lock()
	defer dl.lock.Unlock()
	_, waiting := dl.ids[id]
	// only restart fails when asked (new id)
	restart := created || dl.info.Status == DownloadCancelled || (dl.info.Status == DownloadFailed && !waiting)
	if !restart {
		dl.ids[id] = struct{}{}
		return dl, nil
	}
	clear(dl.ids)
	dl.ids[id] = struct{}{}

	info, err := t.metadataService.GetMetadata(ctx, path, sha)
	if err != nil {
		dl.info = DownloadInfo{Status: DownloadFailed, Error: err.Error()}
		return nil, err
	}
	var video *Video
	for _, v := range info.Videos {
		if v.IsDefault || video == nil {
			video = &v
		}
	}
	if quality != Original && video == nil {
		err := "This file has no video, only the original quality can be downloaded."
		dl.info = DownloadInfo{Status: DownloadFailed, Error: err}
		return nil, echo.NewHTTPError(http.StatusBadRequest, err)
	}
	if quality != Original && quality != NoResize && quality.Height() > video.Height {
		err := "Selected quality is higher than the video's."
		dl.info = DownloadInfo{Status: DownloadFailed, Error: err}
		return nil, echo.NewHTTPError(http.StatusBadRequest, err)
	}

	external := utils.Filter(info.Subtitles, func(sub Subtitle) bool { return sub.IsExternal })
	if quality == Original && len(external) == 0 && info.Extension == "mkv" {
		dl.Path = info.Path
		dl.info = DownloadInfo{Status: DownloadReady, Progress: 100, Size: info.Size}
		return dl, nil
	}
	ctx, cancel := context.WithCancel(ctx)
	dl.cancel = cancel
	dl.info = DownloadInfo{Status: DownloadPending}
	go func() {
		var err error
		select {
		case t.downloadSem <- struct{}{}:
			dl.lock.Lock()
			err = ctx.Err()
			if err == nil {
				dl.info.Status = DownloadPreparing
			}
			dl.lock.Unlock()
			if err == nil {
				err = dl.transcode(ctx, info, video, external, quality)
			}
			<-t.downloadSem
		case <-ctx.Done():
			err = ctx.Err()
		}
		var stat os.FileInfo
		if err == nil {
			stat, err = os.Stat(dl.Path)
		}

		dl.lock.Lock()
		defer dl.lock.Unlock()
		// canceled: `CancelDownload` already set the status and a new run may have started since
		if ctx.Err() != nil {
			return
		}
		if err != nil {
			slog.ErrorContext(ctx, "failed to prepare download", "path", path, "quality", quality, "err", err)
			dl.info = DownloadInfo{Status: DownloadFailed, Error: err.Error()}
			return
		}
		dl.info = DownloadInfo{Status: DownloadReady, Progress: 100, Size: stat.Size()}
	}()
	return dl, nil
}

func (t *Transcoder) CancelDownload(sha string, quality VideoQuality, id string) {
	dl, ok := t.downloads.Get(DownloadKey{sha, quality})
	if !ok {
		return
	}
	dl.lock.Lock()
	defer dl.lock.Unlock()
	if _, ok := dl.ids[id]; !ok {
		return
	}
	delete(dl.ids, id)
	if len(dl.ids) > 0 {
		return
	}
	switch dl.info.Status {
	case DownloadPending, DownloadPreparing:
		dl.cancel()
		dl.info = DownloadInfo{Status: DownloadCancelled}
	case DownloadReady:
		// don't delete original files served as is
		if strings.HasPrefix(dl.Path, Settings.DownloadOutpath) {
			_ = os.Remove(dl.Path)
			dl.info = DownloadInfo{Status: DownloadCancelled}
		}
	}
}

// subtitle codecs ffmpeg's matroska muxer accepts, see
// `ff_mkv_codec_tags` in libavformat/matroska.c & webvtt in libavformat/matroskaenc.c
var mkvSubtitleCodecs = []string{
	"subrip", "text", "ass", "webvtt",
	"dvd_subtitle", "dvb_subtitle", "hdmv_pgs_subtitle", "hdmv_text_subtitle", "arib_caption",
}

func (dl *Download) transcode(
	ctx context.Context,
	info *MediaInfo,
	video *Video,
	external []Subtitle,
	quality VideoQuality,
) error {
	defer utils.PrintExecTime(ctx, "download preparation of %s (%s)", info.Path, quality)()
	err := os.MkdirAll(filepath.Dir(dl.Path), 0o755)
	if err != nil {
		return err
	}
	// unique so a canceled run that's still exiting doesn't delete this one's file
	tmp := fmt.Sprintf("%s-%s.tmp.mkv", strings.TrimSuffix(dl.Path, ".mkv"), rand.Text())
	defer os.Remove(tmp)

	args := []string{
		"-nostats", "-hide_banner",
		"-loglevel", "error",
		"-progress", "pipe:1",
		"-y",
	}
	if quality != Original {
		args = append(args, Settings.HwAccel.DecodeFlags...)
	}
	args = append(
		args,
		"-fflags", "+genpts",
		"-i", info.Path,
	)
	for _, sub := range external {
		args = append(args, "-i", *sub.Path)
	}

	if video != nil {
		args = append(args, (&VideoStream{video: video, quality: quality}).getDownloadArgs(0)...)
	}
	for i, audio := range info.Audios {
		aquality := AOriginal
		if quality == NoResize {
			aquality = matchAudioQuality(video.Quality(), audio.Quality())
		} else if quality != Original {
			aquality = matchAudioQuality(quality, audio.Quality())
		}
		args = append(args, (&AudioStream{audio: &audio, quality: aquality}).getDownloadArgs(i)...)
	}
	// ffmpeg uses the last matching option, this must come before the subtitle specific ones bellow
	args = append(args, "-c:s", "copy")
	internal := 0
	for _, sub := range info.Subtitles[:len(info.Subtitles)-len(external)] {
		switch {
		// mkv doesn't support mov_text
		case sub.Codec == "mov_text":
			args = append(
				args,
				"-map", fmt.Sprintf("0:s:%d", *sub.Index),
				fmt.Sprintf("-c:s:%d", internal), "srt",
			)
		case slices.Contains(mkvSubtitleCodecs, sub.Codec):
			args = append(args, "-map", fmt.Sprintf("0:s:%d", *sub.Index))
		default:
			// skip subtitles mkv can't hold (eia_608, dvb_teletext...) instead of failing
			continue
		}
		internal++
	}
	for i := range external {
		args = append(args, "-map", fmt.Sprintf("%d:s:0", i+1))
	}
	// t is for attachments (fonts used by ass subtitles).
	// they must be last, ffmpeg fails to mux streams of other inputs mapped after them
	args = append(args, "-map", "0:t?")

	for i, sub := range external {
		idx := internal + i
		if sub.Language != nil {
			// players don't all read mkv's bcp47 language
			lang := *sub.Language
			base, conf := language.Make(lang).Base()
			if conf != language.No {
				lang = base.ISO3()
			}
			args = append(args, fmt.Sprintf("-metadata:s:s:%d", idx), "language="+lang)
		}
		if sub.Title != nil && *sub.Title != "" {
			args = append(args, fmt.Sprintf("-metadata:s:s:%d", idx), "title="+*sub.Title)
		}
		disposition := ""
		if sub.IsDefault {
			disposition += "+default"
		}
		if sub.IsForced {
			disposition += "+forced"
		}
		if sub.IsHearingImpaired {
			disposition += "+hearing_impaired"
		}
		args = append(args, fmt.Sprintf("-disposition:s:%d", idx), cmp.Or(disposition, "0"))
	}
	args = append(args, "-f", "matroska", tmp)

	// downloads aren't watched yet, give the cpu to the ones that are
	cmd := exec.CommandContext(ctx, "nice", append([]string{"-n", "10", "ffmpeg"}, args...)...)
	slog.InfoContext(ctx, "preparing download", "args", strings.Join(cmd.Args, " "))
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	var stderr strings.Builder
	cmd.Stderr = &stderr
	err = cmd.Start()
	if err != nil {
		return err
	}

	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		value, ok := strings.CutPrefix(scanner.Text(), "out_time_us=")
		us, err := strconv.ParseInt(value, 10, 64)
		if !ok || err != nil || info.Duration <= 0 {
			continue
		}
		dl.lock.Lock()
		// a canceled run that's still exiting must not touch the next run's progress
		if ctx.Err() == nil {
			dl.info.Progress = min(float64(us)/1_000_000/info.Duration*100, 99.9)
		}
		dl.lock.Unlock()
	}
	if err := scanner.Err(); err != nil {
		slog.WarnContext(ctx, "could not read the download's progress", "err", err)
		// ffmpeg would block writing its progress otherwise
		_, _ = io.Copy(io.Discard, stdout)
	}

	err = cmd.Wait()
	if err != nil {
		return fmt.Errorf("ffmpeg failed: %w: %s", err, stderr.String())
	}
	return os.Rename(tmp, dl.Path)
}

func (t *Transcoder) cleanupDownloads() {
	for range time.Tick(time.Hour) {
		t.downloads.lock.Lock()
		for key, dl := range t.downloads.data {
			dl.lock.Lock()
			stale := time.Since(dl.lastUsage) > 24*time.Hour
			if stale && dl.cancel != nil {
				dl.cancel()
			}
			dl.lock.Unlock()
			if stale {
				delete(t.downloads.data, key)
				// don't delete original files served as is
				if strings.HasPrefix(dl.Path, Settings.DownloadOutpath) {
					_ = os.Remove(dl.Path)
				}
			}
		}
		t.downloads.lock.Unlock()
	}
}
