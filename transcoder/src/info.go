package src

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"

	"github.com/zoriya/go-mediainfo"
)

type MediaInfo struct {
	// The sha1 of the video file.
	Sha string `json:"sha"`
	/// The internal path of the video file.
	Path string `json:"path"`
	/// The extension currently used to store this video file
	Extension string `json:"extension"`
	/// The file size of the video file.
	Size uint64 `json:"size"`
	/// The length of the media in seconds.
	Duration float32 `json:"duration"`
	/// The container of the video file of this episode.
	Container *string `json:"container"`
	/// The video codec and infromations.
	Video *Video `json:"video"`
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
	/// The human readable codec name.
	Codec string `json:"codec"`
	/// The codec of this stream (defined as the RFC 6381).
	MimeCodec *string `json:"mimeCodec"`
	/// The language of this stream (as a ISO-639-2 language code)
	Language *string `json:"language"`
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
	Index uint32 `json:"index"`
	/// The title of the stream.
	Title *string `json:"title"`
	/// The language of this stream (as a ISO-639-2 language code)
	Language *string `json:"language"`
	/// The human readable codec name.
	Codec string `json:"codec"`
	/// The codec of this stream (defined as the RFC 6381).
	MimeCodec *string `json:"mimeCodec"`
	/// Is this stream the default one of it's type?
	IsDefault bool `json:"isDefault"`
	/// Is this stream tagged as forced? (useful only for subtitles)
	IsForced bool `json:"isForced"`
}

type Subtitle struct {
	/// The index of this track on the media.
	Index uint32 `json:"index"`
	/// The title of the stream.
	Title *string `json:"title"`
	/// The language of this stream (as a ISO-639-2 language code)
	Language *string `json:"language"`
	/// The codec of this stream.
	Codec string `json:"codec"`
	/// The extension for the codec.
	Extension *string `json:"extension"`
	/// Is this stream the default one of it's type?
	IsDefault bool `json:"isDefault"`
	/// Is this stream tagged as forced? (useful only for subtitles)
	IsForced bool `json:"isForced"`
	/// The link to access this subtitle.
	Link *string `json:"link"`
}

type Chapter struct {
	/// The start time of the chapter (in second from the start of the episode).
	StartTime float32 `json:"startTime"`
	/// The end time of the chapter (in second from the start of the episode).
	EndTime float32 `json:"endTime"`
	/// The name of this chapter. This should be a human-readable name that could be presented to the user.
	Name string `json:"name"`
	// TODO: add a type field for Opening, Credits...
}

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

func ParseUint64(str string) uint64 {
	i, err := strconv.ParseUint(str, 10, 64)
	if err != nil {
		println(str)
		return 0
	}
	return i
}

func ParseTime(str string) float32 {
	x := strings.Split(str, ":")
	hours, minutes, sms := ParseFloat(x[0]), ParseFloat(x[1]), x[2]
	y := strings.Split(sms, ".")
	seconds, ms := ParseFloat(y[0]), ParseFloat(y[1])

	return (hours*60.+minutes)*60. + seconds + ms/1000.
}

// Stolen from the cmp.Or code that is not yet released
// Or returns the first of its arguments that is not equal to the zero value.
// If no argument is non-zero, it returns the zero value.
func Or[T comparable](vals ...T) T {
	var zero T
	for _, val := range vals {
		if val != zero {
			return val
		}
	}
	return zero
}

func Map[T, U any](ts []T, f func(T, int) U) []U {
	us := make([]U, len(ts))
	for i := range ts {
		us[i] = f(ts[i], i)
	}
	return us
}

func OrNull(str string) *string {
	if str == "" {
		return nil
	}
	return &str
}

var SubtitleExtensions = map[string]string{
	"subrip": "srt",
	"ass":    "ass",
	"vtt":    "vtt",
}

type MICache struct {
	info  *MediaInfo
	ready sync.WaitGroup
}

var infos = NewCMap[string, *MICache]()

func GetInfo(path string, sha string) (*MediaInfo, error) {
	var err error

	ret, _ := infos.GetOrCreate(sha, func() *MICache {
		mi := &MICache{info: &MediaInfo{Sha: sha}}
		mi.ready.Add(1)
		go func() {
			save_path := fmt.Sprintf("%s/%s/info.json", Settings.Metadata, sha)
			if err := getSavedInfo(save_path, mi.info); err == nil {
				log.Printf("Using mediainfo cache on filesystem for %s", path)
				mi.ready.Done()
				return
			}

			var val *MediaInfo
			val, err = getInfo(path)
			*mi.info = *val
			mi.info.Sha = sha
			mi.ready.Done()
			saveInfo(save_path, mi.info)
		}()
		return mi
	})
	ret.ready.Wait()
	return ret.info, err
}

func getSavedInfo[T any](save_path string, mi *T) error {
	saved_file, err := os.Open(save_path)
	if err != nil {
		return err
	}
	saved, err := io.ReadAll(saved_file)
	if err != nil {
		return err
	}
	err = json.Unmarshal([]byte(saved), mi)
	if err != nil {
		return err
	}
	return nil
}

func saveInfo[T any](save_path string, mi *T) error {
	content, err := json.Marshal(*mi)
	if err != nil {
		return err
	}
	return os.WriteFile(save_path, content, 0o644)
}

func getInfo(path string) (*MediaInfo, error) {
	defer printExecTime("mediainfo for %s", path)()

	mi, err := mediainfo.Open(path)
	if err != nil {
		return nil, err
	}
	defer mi.Close()

	chapters_begin := ParseUint(mi.Parameter(mediainfo.StreamMenu, 0, "Chapters_Pos_Begin"))
	chapters_end := ParseUint(mi.Parameter(mediainfo.StreamMenu, 0, "Chapters_Pos_End"))

	attachments := strings.Split(mi.Parameter(mediainfo.StreamGeneral, 0, "Attachments"), " / ")
	if len(attachments) == 1 && attachments[0] == "" {
		attachments = make([]string, 0)
	}

	// fmt.Printf("%s", mi.Option("info_parameters", ""))

	ret := MediaInfo{
		Path: path,
		// Remove leading .
		Extension: filepath.Ext(path)[1:],
		Size:      ParseUint64(mi.Parameter(mediainfo.StreamGeneral, 0, "FileSize")),
		// convert ms to seconds
		Duration:  ParseFloat(mi.Parameter(mediainfo.StreamGeneral, 0, "Duration")) / 1000,
		Container: OrNull(mi.Parameter(mediainfo.StreamGeneral, 0, "Format")),
		Videos: Map(make([]Video, ParseUint(mi.Parameter(mediainfo.StreamVideo, 0, "StreamCount"))), func(_ Video, i int) Video {
			return Video{
				Codec:     mi.Parameter(mediainfo.StreamVideo, i, "Format"),
				MimeCodec: GetMimeCodec(mi, mediainfo.StreamVideo, i),
				Language:  OrNull(mi.Parameter(mediainfo.StreamVideo, i, "Language")),
				Quality:   QualityFromHeight(ParseUint(mi.Parameter(mediainfo.StreamVideo, i, "Height"))),
				Width:     ParseUint(mi.Parameter(mediainfo.StreamVideo, i, "Width")),
				Height:    ParseUint(mi.Parameter(mediainfo.StreamVideo, i, "Height")),
				Bitrate: ParseUint(
					Or(
						mi.Parameter(mediainfo.StreamVideo, i, "BitRate"),
						mi.Parameter(mediainfo.StreamVideo, i, "OverallBitRate"),
						mi.Parameter(mediainfo.StreamVideo, i, "BitRate_Nominal"),
					),
				),
			}
		}),
		Audios: Map(make([]Audio, ParseUint(mi.Parameter(mediainfo.StreamAudio, 0, "StreamCount"))), func(_ Audio, i int) Audio {
			return Audio{
				Index:     uint32(i),
				Title:     OrNull(mi.Parameter(mediainfo.StreamAudio, i, "Title")),
				Language:  OrNull(mi.Parameter(mediainfo.StreamAudio, i, "Language")),
				Codec:     mi.Parameter(mediainfo.StreamAudio, i, "Format"),
				MimeCodec: GetMimeCodec(mi, mediainfo.StreamAudio, i),
				IsDefault: mi.Parameter(mediainfo.StreamAudio, i, "Default") == "Yes",
				IsForced:  mi.Parameter(mediainfo.StreamAudio, i, "Forced") == "Yes",
			}
		}),
		Subtitles: Map(make([]Subtitle, ParseUint(mi.Parameter(mediainfo.StreamText, 0, "StreamCount"))), func(_ Subtitle, i int) Subtitle {
			format := strings.ToLower(mi.Parameter(mediainfo.StreamText, i, "Format"))
			if format == "utf-8" {
				format = "subrip"
			}
			extension := OrNull(SubtitleExtensions[format])
			var link *string
			if extension != nil {
				x := fmt.Sprintf("%s/%s/subtitle/%d.%s", Settings.RoutePrefix, base64.StdEncoding.EncodeToString([]byte(path)), i, *extension)
				link = &x
			}
			return Subtitle{
				Index:     uint32(i),
				Title:     OrNull(mi.Parameter(mediainfo.StreamText, i, "Title")),
				Language:  OrNull(mi.Parameter(mediainfo.StreamText, i, "Language")),
				Codec:     format,
				Extension: extension,
				IsDefault: mi.Parameter(mediainfo.StreamText, i, "Default") == "Yes",
				IsForced:  mi.Parameter(mediainfo.StreamText, i, "Forced") == "Yes",
				Link:      link,
			}
		}),
		Chapters: Map(make([]Chapter, max(chapters_end-chapters_begin, 1)-1), func(_ Chapter, i int) Chapter {
			return Chapter{
				StartTime: ParseTime(mi.GetI(mediainfo.StreamMenu, 0, int(chapters_begin)+i, mediainfo.InfoName)),
				// +1 is safe, the value at chapters_end contains the right duration
				EndTime: ParseTime(mi.GetI(mediainfo.StreamMenu, 0, int(chapters_begin)+i+1, mediainfo.InfoName)),
				Name:    mi.GetI(mediainfo.StreamMenu, 0, int(chapters_begin)+i, mediainfo.InfoText),
			}
		}),
		Fonts: Map(
			attachments,
			func(font string, _ int) string {
				return fmt.Sprintf("%s/%s/attachment/%s", Settings.RoutePrefix, base64.StdEncoding.EncodeToString([]byte(path)), font)
			}),
	}
	if len(ret.Videos) > 0 {
		ret.Video = &ret.Videos[0]
	}
	return &ret, nil
}
