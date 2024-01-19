package src

type Downloader struct{}

func NewDownloader() *Downloader {
	return nil
}

func (d *Downloader) GetOffline(path string, quality Quality) (string, error) {
	return "", nil
}
