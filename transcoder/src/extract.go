package src

import (
	"fmt"
	"os"
	"os/exec"
)

func GetMetadataPath() string {
	out := os.Getenv("GOCODER_METADATA_ROOT")
	if out == "" {
		return "/metadata"
	}
	return out
}

func extract(path string, sha string, subs *[]Subtitle) {
	fmt.Printf("Extract subs and fonts for %s", path)
	cmd := exec.Command(
		"ffmpeg",
		"-dump_attachment:t", "",
		"-i", path,
	)
	cmd.Dir = fmt.Sprintf("/%s/%s/att/", GetMetadataPath(), sha)

	for _, sub := range *subs {
		if ext := sub.Extension; ext != nil {
			cmd.Args = append(
				cmd.Args,
				"-map", fmt.Sprintf("0:s:%d", sub.Index),
				"-c:s", "copy",
				fmt.Sprintf("/%s/%s/sub/%d.%s", GetMetadataPath(), sha, sub.Index, *ext),
			)
		}
	}
	fmt.Printf("Starting extraction with the command: %s", cmd)
	cmd.Stdout = nil
	err := cmd.Run()
	if err != nil {
		fmt.Println("Error starting ffmpeg extract:", err)
	}
}
