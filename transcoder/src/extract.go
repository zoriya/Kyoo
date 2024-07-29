package src

import (
	"fmt"
	"log"
	"os"
	"os/exec"
)

var extracted = NewCMap[string, <-chan struct{}]()

const ExtractVersion = 1

func (s MetadataService) ExtractSubs(info *MediaInfo) (interface{}, error) {
	get_running, set := s.extractLock.Start(info.Sha)
	if get_running != nil {
		return get_running()
	}

	err := extractSubs(info)
	if err != nil {
		return set(nil, err)
	}
	_, err = s.database.NamedExec(
		`update info set ver_extract = :version where sha = :sha`,
		map[string]interface{}{
			"sha":     info.Sha,
			"version": ExtractVersion,
		},
	)
	return set(nil, err)
}

func extractSubs(info *MediaInfo) error {
	defer printExecTime("Starting extraction of %s", info.Path)()

	attachment_path := fmt.Sprintf("%s/%s/att", Settings.Metadata, info.Sha)
	subs_path := fmt.Sprintf("%s/%s/sub", Settings.Metadata, info.Sha)

	os.MkdirAll(attachment_path, 0o755)
	os.MkdirAll(subs_path, 0o755)

	// If there is no subtitles, there is nothing to extract (also fonts would be useless).
	if len(info.Subtitles) == 0 {
		return nil
	}

	cmd := exec.Command(
		"ffmpeg",
		"-dump_attachment:t", "",
		// override old attachments
		"-y",
		"-i", info.Path,
	)
	cmd.Dir = attachment_path

	for _, sub := range info.Subtitles {
		if ext := sub.Extension; ext != nil {
			cmd.Args = append(
				cmd.Args,
				"-map", fmt.Sprintf("0:s:%d", sub.Index),
				"-c:s", "copy",
				fmt.Sprintf("%s/%d.%s", subs_path, sub.Index, *ext),
			)
		}
	}
	log.Printf("Starting extraction with the command: %s", cmd)
	cmd.Stdout = nil
	err := cmd.Run()
	if err != nil {
		fmt.Println("Error starting ffmpeg extract:", err)
		return err
	}
	return nil
}
