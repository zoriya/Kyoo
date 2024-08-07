package src

import (
	"cmp"
	"context"
	"encoding/base64"
	"fmt"
	"mime"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"golang.org/x/text/language"
	"gopkg.in/vansante/go-ffprobe.v2"
)

const InfoVersion = 1

type Versions struct {
	Info      int32 `db:"ver_info"`
	Extract   int32 `db:"ver_extract"`
	Thumbs    int32 `db:"ver_thumbs"`
	Keyframes int32 `db:"ver_keyframes"`
}

type MediaInfo struct {
	// The sha1 of the video file.
	Sha string `json:"sha"`
	/// The internal path of the video file.
	Path string `json:"path"`
	/// The extension currently used to store this video file
	Extension string `json:"extension"`
	/// The whole mimetype (defined as the RFC 6381). ex: `video/mp4; codecs="avc1.640028, mp4a.40.2"`
	MimeCodec *string `json:"mimeCodec" db:"mime_codec"`
	/// The file size of the video file.
	Size int64 `json:"size"`
	/// The length of the media in seconds.
	Duration float32 `json:"duration"`
	/// The container of the video file of this episode.
	Container *string `json:"container"`
	/// Version of the metadata. This can be used to invalidate older metadata from db if the extraction code has changed.
	Versions Versions

	// TODO: remove this
	Video *Video

	/// The list of videos if there are multiples.
	Videos []Video `json:"videos"`
	/// The list of audio tracks.
	Audios []Audio `json:"audios"`
	/// The list of subtitles tracks.
	Subtitles []Subtitle `json:"subtitles"`
	/// The list of fonts that can be used to display subtitles.
	Fonts []string `json:"fonts"`
	/// The list of chapters. See Chapter for more information.
	Chapters []Chapter `json:"chapters"`
}

type Video struct {
	/// The index of this track on the media.
	Index uint32 `json:"index" db:"idx"`
	/// The title of the stream.
	Title *string `json:"title"`
	/// The language of this stream (as a ISO-639-2 language code)
	Language *string `json:"language"`
	/// The human readable codec name.
	Codec string `json:"codec"`
	/// The codec of this stream (defined as the RFC 6381).
	MimeCodec *string `json:"mimeCodec" db:"mime_codec"`
	/// The max quality of this video track.
	Quality Quality `json:"quality"`
	/// The width of the video stream
	Width uint32 `json:"width"`
	/// The height of the video stream
	Height uint32 `json:"height"`
	/// The average bitrate of the video in bytes/s
	Bitrate uint32 `json:"bitrate"`
}

type Audio struct {
	/// The index of this track on the media.
	Index uint32 `json:"index" db:"idx"`
	/// The title of the stream.
	Title *string `json:"title"`
	/// The language of this stream (as a IETF-BCP-47 language code)
	Language *string `json:"language"`
	/// The human readable codec name.
	Codec string `json:"codec"`
	/// The codec of this stream (defined as the RFC 6381).
	MimeCodec *string `json:"mimeCodec" db:"mime_codec"`
	/// Is this stream the default one of it's type?
	IsDefault bool `json:"isDefault" db:"is_default"`
}

type Subtitle struct {
	/// The index of this track on the media.
	Index *uint32 `json:"index" db:"idx"`
	/// The title of the stream.
	Title *string `json:"title"`
	/// The language of this stream (as a IETF-BCP-47 language code)
	Language *string `json:"language"`
	/// The codec of this stream.
	Codec string `json:"codec"`
	/// The extension for the codec.
	Extension *string `json:"extension"`
	/// Is this stream the default one of it's type?
	IsDefault bool `json:"isDefault" db:"is_default"`
	/// Is this stream tagged as forced?
	IsForced bool `json:"isForced" db:"is_forced"`
	/// Is this an external subtitle (as in stored in a different file)
	IsExternal bool `json:"isExternal" db:"is_external"`
	/// Where the subtitle is stored (either in library if IsExternal is true or in transcoder cache if false)
	/// Null if the subtitle can't be extracted (unsupported format)
	Path *string `json:"path"`
	/// The link to access this subtitle.
	Link *string `json:"link"`
}

type Chapter struct {
	/// The start time of the chapter (in second from the start of the episode).
	StartTime float32 `json:"startTime" db:"start_time"`
	/// The end time of the chapter (in second from the start of the episode).
	EndTime float32 `json:"endTime" db:"end_time"`
	/// The name of this chapter. This should be a human-readable name that could be presented to the user.
	Name string `json:"name"`
	/// The type value is used to mark special chapters (openning/credits...)
	Type ChapterType
}

type ChapterType string

const (
	Content ChapterType = "content"
	Recap   ChapterType = "recap"
	Intro   ChapterType = "intro"
	Credits ChapterType = "credits"
	Preview ChapterType = "preview"
)

func ParseFloat(str string) float32 {
	f, err := strconv.ParseFloat(str, 32)
	if err != nil {
		return 0
	}
	return float32(f)
}

func ParseUint(str string) uint32 {
	i, err := strconv.ParseUint(str, 10, 32)
	if err != nil {
		println(str)
		return 0
	}
	return uint32(i)
}

func ParseInt64(str string) int64 {
	i, err := strconv.ParseInt(str, 10, 64)
	if err != nil {
		println(str)
		return 0
	}
	return i
}

func Map[T, U any](ts []T, f func(T, int) U) []U {
	us := make([]U, len(ts))
	for i := range ts {
		us[i] = f(ts[i], i)
	}
	return us
}

func MapStream[T any](streams []*ffprobe.Stream, kind ffprobe.StreamType, mapper func(*ffprobe.Stream, uint32) T) []T {
	count := 0
	for _, stream := range streams {
		if stream.CodecType == string(kind) {
			count++
		}
	}
	ret := make([]T, count)

	i := uint32(0)
	for _, stream := range streams {
		if stream.CodecType == string(kind) {
			ret[i] = mapper(stream, i)
			i++
		}
	}
	return ret
}

func OrNull(str string) *string {
	if str == "" {
		return nil
	}
	return &str
}

func NullIfUnd(str string) *string {
	if str == "und" {
		return nil
	}
	return &str
}

var SubtitleExtensions = map[string]string{
	"subrip": "srt",
	"ass":    "ass",
	"vtt":    "vtt",
}

func RetriveMediaInfo(path string, sha string) (*MediaInfo, error) {
	defer printExecTime("mediainfo for %s", path)()

	ctx, cancelFn := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancelFn()

	mi, err := ffprobe.ProbeURL(ctx, path)
	if err != nil {
		return nil, err
	}

	ret := MediaInfo{
		Sha:  sha,
		Path: path,
		// Remove leading .
		Extension: filepath.Ext(path)[1:],
		Size:      ParseInt64(mi.Format.Size),
		Duration:  float32(mi.Format.DurationSeconds),
		Container: OrNull(mi.Format.FormatName),
		Versions: Versions{
			Info:      InfoVersion,
			Extract:   0,
			Thumbs:    0,
			Keyframes: 0,
		},
		Videos: MapStream(mi.Streams, ffprobe.StreamVideo, func(stream *ffprobe.Stream, i uint32) Video {
			lang, _ := language.Parse(stream.Tags.Language)
			return Video{
				Index:     i,
				Codec:     stream.CodecName,
				MimeCodec: GetMimeCodec(stream),
				Title:     OrNull(stream.Tags.Title),
				Language:  NullIfUnd(lang.String()),
				Quality:   QualityFromHeight(uint32(stream.Height)),
				Width:     uint32(stream.Width),
				Height:    uint32(stream.Height),
				// ffmpeg does not report bitrate in mkv files, fallback to bitrate of the whole container
				// (bigger than the result since it contains audio and other videos but better than nothing).
				Bitrate: ParseUint(cmp.Or(stream.BitRate, mi.Format.BitRate)),
			}
		}),
		Audios: MapStream(mi.Streams, ffprobe.StreamAudio, func(stream *ffprobe.Stream, i uint32) Audio {
			lang, _ := language.Parse(stream.Tags.Language)
			return Audio{
				Index:     i,
				Title:     OrNull(stream.Tags.Title),
				Language:  NullIfUnd(lang.String()),
				Codec:     stream.CodecName,
				MimeCodec: GetMimeCodec(stream),
				IsDefault: stream.Disposition.Default != 0,
			}
		}),
		Subtitles: MapStream(mi.Streams, ffprobe.StreamSubtitle, func(stream *ffprobe.Stream, i uint32) Subtitle {
			extension := OrNull(SubtitleExtensions[stream.CodecName])
			var link string
			var path string
			if extension != nil {
				link = fmt.Sprintf("%s/%s/subtitle/%d.%s", Settings.RoutePrefix, base64.StdEncoding.EncodeToString([]byte(path)), i, *extension)
				path = fmt.Sprintf("%s/%s/sub/%d.%s", Settings.Metadata, sha, i, extension)
			}
			lang, _ := language.Parse(stream.Tags.Language)
			idx := uint32(i)
			return Subtitle{
				Index:     &idx,
				Title:     OrNull(stream.Tags.Title),
				Language:  NullIfUnd(lang.String()),
				Codec:     stream.CodecName,
				Extension: extension,
				IsDefault: stream.Disposition.Default != 0,
				IsForced:  stream.Disposition.Forced != 0,
				Link:      &link,
				Path:      &path,
			}
		}),
		Chapters: Map(mi.Chapters, func(c *ffprobe.Chapter, _ int) Chapter {
			return Chapter{
				Name:      c.Title(),
				StartTime: float32(c.StartTimeSeconds),
				EndTime:   float32(c.EndTimeSeconds),
				// TODO: detect content type
				Type: Content,
			}
		}),
		Fonts: MapStream(mi.Streams, ffprobe.StreamAttachment, func(stream *ffprobe.Stream, i uint32) string {
			font, _ := stream.TagList.GetString("filename")
			return fmt.Sprintf("%s/%s/attachment/%s", Settings.RoutePrefix, base64.StdEncoding.EncodeToString([]byte(path)), font)
		}),
	}
	var codecs []string
	if len(ret.Videos) > 0 && ret.Videos[0].MimeCodec != nil {
		codecs = append(codecs, *ret.Videos[0].MimeCodec)
	}
	if len(ret.Audios) > 0 && ret.Audios[0].MimeCodec != nil {
		codecs = append(codecs, *ret.Audios[0].MimeCodec)
	}
	container := mime.TypeByExtension(fmt.Sprintf(".%s", ret.Extension))
	if container != "" {
		if len(codecs) > 0 {
			codecs_str := strings.Join(codecs, ", ")
			mime := fmt.Sprintf("%s; codecs=\"%s\"", container, codecs_str)
			ret.MimeCodec = &mime
		} else {
			ret.MimeCodec = &container
		}
	}

	if len(ret.Videos) > 0 {
		ret.Video = &ret.Videos[0]
	}
	return &ret, nil
}
