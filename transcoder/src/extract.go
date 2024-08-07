package src

import (
	"fmt"
	"log"
	"os"
	"os/exec"
)

var extracted = NewCMap[string, <-chan struct{}]()

func Extract(path string, sha string) (<-chan struct{}, error) {
	ret := make(chan struct{})
	existing, created := extracted.GetOrSet(sha, ret)
	if !created {
		return existing, nil
	}

	go func() {
		defer printExecTime("Starting extraction of %s", path)()
		info, err := GetInfo(path, sha)
		if err != nil {
			extracted.Remove(sha)
			close(ret)
			return
		}
		attachment_path := fmt.Sprintf("%s/%s/att", Settings.Metadata, sha)
		subs_path := fmt.Sprintf("%s/%s/sub", Settings.Metadata, sha)
		os.MkdirAll(attachment_path, 0o755)
		os.MkdirAll(subs_path, 0o755)

		// If there is no subtitles, there is nothing to extract (also fonts would be useless).
		if len(info.Subtitles) == 0 {
			close(ret)
			return
		}

		cmd := exec.Command(
			"ffmpeg",
			"-dump_attachment:t", "",
			// override old attachments
			"-y",
			"-i", path,
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
		err = cmd.Run()
		if err != nil {
			extracted.Remove(sha)
			fmt.Println("Error starting ffmpeg extract:", err)
		}
		close(ret)
	}()

	return ret, nil
}
