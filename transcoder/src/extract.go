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

func GetMetadataPath() string {
	out := os.Getenv("GOCODER_METADATA_ROOT")
	if out == "" {
		return "/metadata"
	}
	return out
}

func NewExtractor() *Extractor {
	return &Extractor{
		extracted: make(map[string]<-chan struct{}),
	}
}

func (e *Extractor) Extract(sha string) (<-chan struct{}, bool) {
	e.lock.RLock()
	existing, ok := e.extracted[sha]
	e.lock.RUnlock()

	if ok {
		return existing, true
	}
	return nil, false
}

func (e *Extractor) RunExtractor(path string, sha string, subs *[]Subtitle) <-chan struct{} {
	existing, ok := e.Extract(sha)
	if ok {
		return existing
	}

	ret := make(chan struct{})
	e.lock.Lock()
	e.extracted[sha] = ret
	e.lock.Unlock()

	go func() {
		attachment_path := fmt.Sprintf("%s/%s/att/", GetMetadataPath(), sha)
		subs_path := fmt.Sprintf("%s/%s/sub/", GetMetadataPath(), sha)
		os.MkdirAll(attachment_path, 0o644)
		os.MkdirAll(subs_path, 0o644)

		fmt.Printf("Extract subs and fonts for %s", path)
		cmd := exec.Command(
			"ffmpeg",
			"-dump_attachment:t", "",
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

	return ret
}
