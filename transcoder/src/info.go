package src

import (
	"crypto/sha1"
	"encoding/hex"
	"path/filepath"
	"strconv"

	"github.com/zelenin/go-mediainfo"
)

type MediaInfo struct {
	// The sha1 of the video file.
	Sha string `json:"sha"`
	/// The internal path of the video file.
	Path string `json:"path"`
	/// The extension currently used to store this video file
	Extension string `json:"extension"`
	/// The length of the media in seconds.
	Length float32 `json:"length"`
	/// The container of the video file of this episode.
	Container string `json:"container"`
	/// The video codec and infromations.
	Video Video `json:"video"`
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
	/// The codec of this stream (defined as the RFC 6381).
	Codec string `json:"codec"`
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
	/// The codec of this stream.
	Codec string `json:"codec"`
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
		panic(err)
	}
	return float32(f)
}

func ParseUint(str string) uint32 {
	i, err := strconv.ParseUint(str, 10, 32)
	if err != nil {
		panic(err)
	}
	return uint32(i)
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

func Map[T any](ts []T, f func(int) T) []T {
	for i := range ts {
		ts[i] = f(i)
	}
	return ts
}

func OrNull(str string) *string {
	if str == "" {
		return nil
	}
	return &str
}

func GetInfo(path string) (MediaInfo, error) {
	mi, err := mediainfo.Open(path)
	if err != nil {
		return MediaInfo{}, err
	}
	defer mi.Close()

	// TODO: extract

	sha := mi.Parameter(mediainfo.StreamGeneral, 0, "UniqueID")
	// Remove dummy values that some tools use.
	if len(sha) <= 5 {
		date := mi.Parameter(mediainfo.StreamGeneral, 0, "File_Modified_Date")

		h := sha1.New()
		h.Write([]byte(path))
		h.Write([]byte(date))
		sha = hex.EncodeToString(h.Sum(nil))
	}

	return MediaInfo{
		Sha:  sha,
		Path: path,
		// Remove leading .
		Extension: filepath.Ext(path)[1:],
		// convert seconds to ms
		Length:    ParseFloat(mi.Parameter(mediainfo.StreamGeneral, 0, "Duration")) / 1000,
		Container: mi.Parameter(mediainfo.StreamGeneral, 0, "Format"),
		Video: Video{
			// This codec is not in the right format (does not include bitdepth...).
			Codec:    mi.Parameter(mediainfo.StreamVideo, 0, "Format"),
			Language: OrNull(mi.Parameter(mediainfo.StreamVideo, 0, "Language")),
			Quality:  QualityFromHeight(ParseUint(mi.Parameter(mediainfo.StreamVideo, 0, "Height"))),
			Width:    ParseUint(mi.Parameter(mediainfo.StreamVideo, 0, "Width")),
			Height:   ParseUint(mi.Parameter(mediainfo.StreamVideo, 0, "Height")),
			Bitrate: ParseUint(
				Or(
					mi.Parameter(mediainfo.StreamVideo, 0, "BitRate"),
					mi.Parameter(mediainfo.StreamVideo, 0, "OverallBitRate"),
				),
			),
		},
		Audios: Map(make([]Audio, ParseUint(mi.Parameter(mediainfo.StreamAudio, 0, "StreamCount"))), func(i int) Audio {
			return Audio{
				Index:    uint32(i),
				Title:    OrNull(mi.Parameter(mediainfo.StreamAudio, i, "Title")),
				Language: OrNull(mi.Parameter(mediainfo.StreamAudio, i, "Language")),
				// TODO: format is invalid. Channels count missing...
				Codec:     mi.Parameter(mediainfo.StreamAudio, i, "Format"),
				IsDefault: mi.Parameter(mediainfo.StreamAudio, i, "Default") == "Yes",
				IsForced:  mi.Parameter(mediainfo.StreamAudio, i, "Forced") == "Yes",
			}
		}),
	}, nil
}
