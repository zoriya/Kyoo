package transcoder

type TranscodeStream struct {
	File    FileStream
	Clients []string
	// true if the segment at given index is completed/transcoded, false otherwise
	segments []bool
	// TODO: add ffmpeg process
}
