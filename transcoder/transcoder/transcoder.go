package transcoder

type Transcoder struct {
	// All file streams currently running, index is file path
	streams map[string]FileStream
}

func (t *Transcoder) GetMaster(path string, client string) (string, error) {
	stream, ok := t.streams[path]
	if !ok {
		stream, err := NewFileStream(path)
		if err != nil {
			return "", err
		}
		t.streams[path] = *stream
	}
	return stream.GetMaster(), nil
}
