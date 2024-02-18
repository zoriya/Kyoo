package src

import (
	"fmt"
	"os"
	"os/exec"
	"sync"
)

type Extractor struct {
	extracted map[string]<-chan struct{}
	lock      sync.RWMutex
}

func NewExtractor() *Extractor {
	return &Extractor{
		extracted: make(map[string]<-chan struct{}),
	}
}

func (e *Extractor) Extract(path string, subs *[]Subtitle) (<-chan struct{}, error) {
	sha, err := getHash(path)
	if err != nil {
		return nil, err
	}

	e.lock.Lock()
	existing, ok := e.extracted[sha]
	if ok {
		return existing, nil
	}
	ret := make(chan struct{})
	e.extracted[sha] = ret
	e.lock.Unlock()

	go func() {
		attachment_path := fmt.Sprintf("%s/%s/att", Settings.Metadata, sha)
		subs_path := fmt.Sprintf("%s/%s/sub", Settings.Metadata, sha)
		os.MkdirAll(attachment_path, 0o644)
		os.MkdirAll(subs_path, 0o755)

		fmt.Printf("Extract subs and fonts for %s", path)
		cmd := exec.Command(
			"ffmpeg",
			"-dump_attachment:t", "",
			// override old attachments
			"-y",
			"-i", path,
		)
		cmd.Dir = attachment_path

		for _, sub := range *subs {
			if ext := sub.Extension; ext != nil {
				cmd.Args = append(
					cmd.Args,
					"-map", fmt.Sprintf("0:s:%d", sub.Index),
					"-c:s", "copy",
					fmt.Sprintf("%s/%d.%s", subs_path, sub.Index, *ext),
				)
			}
		}
		fmt.Printf("Starting extraction with the command: %s", cmd)
		cmd.Stdout = nil
		err := cmd.Run()
		if err != nil {
			fmt.Println("Error starting ffmpeg extract:", err)
		}
		close(ret)
	}()

	return ret, nil
}
