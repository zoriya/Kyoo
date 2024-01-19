package src

import (
	"fmt"
	"log"
	"os/exec"
	"sync"
)

type Key struct {
	path    string
	quality Quality
}

type Value struct {
	done chan struct{}
	path string
}

type Downloader struct {
	processing map[Key]Value
	lock       sync.Mutex
}

func NewDownloader() *Downloader {
	return &Downloader{
		processing: make(map[Key]Value),
	}
}

func (d *Downloader) GetOffline(path string, quality Quality) (<-chan struct{}, string, error) {
	key := Key{path, quality}
	d.lock.Lock()
	defer d.lock.Unlock()
	existing, ok := d.processing[key]

	if ok {
		return existing.done, existing.path, nil
	}

	info, err := GetInfo(path)
	if err != nil {
		return nil, "", err
	}
	outpath := fmt.Sprintf("%s/dl-%s-%s.mkv", GetOutPath(), info.Sha, quality)

	ret := make(chan struct{})
	d.processing[key] = Value{ret, outpath}

	go func() {
		cmd := exec.Command(
			"ffmpeg",
			"-nostats", "-hide_banner", "-loglevel", "warning",
			"-i", path,
		)
		cmd.Args = append(cmd.Args, quality.getTranscodeArgs(nil)...)
		// TODO: add custom audio settings depending on quality
		cmd.Args = append(cmd.Args,
			"-map", "0:a?",
			"-c:a", "aac",
			"-ac", "2",
			"-b:a", "128k",
		)
		// also include subtitles, font attachments and chapters.
		cmd.Args = append(cmd.Args,
			"-map", "0:s?", "-c:s", "copy",
			"-map", "0:d?",
			"-map", "0:t?",
		)
		cmd.Args = append(cmd.Args, outpath)

		log.Printf(
			"Starting offline transcode (quality %s) of %s with the command: %s",
			quality,
			path,
			cmd,
		)
		cmd.Stdout = nil
		err := cmd.Run()
		if err != nil {
			log.Println("Error starting ffmpeg extract:", err)
			// TODO: find a way to inform listeners that there was an error

			d.lock.Lock()
			delete(d.processing, key)
			d.lock.Unlock()
		} else {
			log.Println("Transcode finished")
		}

		close(ret)
	}()
	return ret, outpath, nil
}
