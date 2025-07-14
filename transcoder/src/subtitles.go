package src

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/zoriya/kyoo/transcoder/src/utils"
	"golang.org/x/text/language"
)

var separator = regexp.MustCompile(`[\s.]+`)

func (mi *MediaInfo) SearchExternalSubtitles() error {
	base_path := strings.TrimSuffix(mi.Path, filepath.Ext(mi.Path))
	dir, err := os.ReadDir(filepath.Dir(mi.Path))
	if err != nil {
		return err
	}

outer:
	for _, entry := range dir {
		match := filepath.Join(filepath.Dir(mi.Path), entry.Name())
		if entry.IsDir() || !strings.HasPrefix(match, base_path) {
			continue
		}

		for codec, ext := range SubtitleExtensions {
			if strings.HasSuffix(match, ext) {
				link := fmt.Sprintf(
					"video/%s/direct/%s",
					base64.RawURLEncoding.EncodeToString([]byte(match)),
					filepath.Base(match),
				)
				sub := Subtitle{
					Index:      nil,
					Codec:      codec,
					Extension:  &ext,
					IsExternal: true,
					Path:       &match,
					Link:       &link,
				}
				flags_str := strings.ToLower(match[len(base_path):])
				flags := separator.Split(flags_str, -1)

				// remove extension from flags
				flags = flags[:len(flags)-1]

				for _, flag := range flags {
					switch flag {
					case "default":
						sub.IsDefault = true
					case "forced":
						sub.IsForced = true
					case "hi", "sdh", "cc":
						sub.IsHearingImpaired = true
					default:
						lang, err := language.Parse(flag)
						if err == nil && lang != language.Und {
							langStr := lang.String()
							sub.Language = &langStr
						} else {
							sub.Title = &flag
						}
					}
				}

				// Handle Hindi (hi) collision with Hearing Impaired (hi):
				// "hi" by itself means a language code, but when combined with other lang flags it means Hearing Impaired.
				// In case Hindi was not detected before, but "hi" is present, assume it is Hindi.
				if sub.Language == nil {
					hiCount := utils.Count(flags, "hi")
					if hiCount > 0 {
						languageStr := language.Hindi.String()
						sub.Language = &languageStr
					}
					if hiCount == 1 {
						sub.IsHearingImpaired = false
					}
				}

				mi.Subtitles = append(mi.Subtitles, sub)
				continue outer
			}
		}
	}
	return nil
}
