package src

import (
	"encoding/base64"
	"fmt"
	"path/filepath"
	"regexp"
	"strings"

	"golang.org/x/text/language"
)

var separator = regexp.MustCompile(`[\s.]+`)

func (mi *MediaInfo) SearchExternalSubtitles() error {
	base_path := strings.TrimSuffix(mi.Path, filepath.Ext(mi.Path))
	matches, err := filepath.Glob(fmt.Sprintf("%s*", base_path))
	if err != nil {
		return err
	}

outer:
	for _, match := range matches {
		for codec, ext := range SubtitleExtensions {
			if strings.HasSuffix(match, ext) {
				link := fmt.Sprintf(
					"%s/direct/%s",
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
				flags := separator.Split(match[len(base_path):], -1)
				// remove extension from flags
				flags = flags[:len(flags)-1]

				for _, flag := range flags {
					switch strings.ToLower(flag) {
					case "default":
						sub.IsDefault = true
					case "forced":
						sub.IsForced = true
					default:
						lang, err := language.Parse(flag)
						if err == nil && lang != language.Und {
							lang := lang.String()
							sub.Language = &lang
						} else {
							sub.Title = &flag
						}
					}
				}
				mi.Subtitles = append(mi.Subtitles, sub)
				continue outer
			}
		}
	}
	return nil
}
