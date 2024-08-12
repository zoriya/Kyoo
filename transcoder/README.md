# Gocoder

## Features

- Lazily transcode via **HLS**
  - Support automatic quality switches
  - Support transmuxing as a quality
  - Allows multiples clients to share the same transcode stream
- **Hardware acceleration** support (vaapi, qsv, cuda)
- Extract **media info** from files (bitrate, chapters...) and stores it in database
- Extract and serves **subtitles** or attachments (like fonts)
- Create **thumbnails sprites** (& vtt metadata) for scrubbing (mouse hover on seek bar)

## Content/Quality negotation

Instead of having complex logic to know which client supports which codecs, we use HLS to it's full potential.
Each quality & codec supported by gocoder is specified in the manifest and the client is free to pick the one it can play (and switch on the fly to change quality if network changes).

This makes the API easier (to adopt for new clients & to write) but it means it's harder to handle transmuxing.
I did a blog post explaining the core idea, you can find it at [zoriya.dev/blogs/transcoder](https://zoriya.dev/blogs/transcoder).

## Usage

Gocoder is shipped as a docker image configurable via env variables (see `.env.example`). Using it outside Kyoo is supported.
There is no swagger as of now, you can look at `main.go` for the list of routes.

Projects using gocoder:
- Kyoo (obviously)
- [Meelo](https://github.com/Arthi-chaud/Meelo)
- [Blee](https://github.com/Arthi-chaud/Blee)
- Add your own?

## How does this work

I did a blog post explaining the core idea, you can find it at [zoriya.dev/blogs/transcoder](https://zoriya.dev/blogs/transcoder).

## TODO:
- Add a swagger
- Add configurable JWT authorization (v5 of kyoo)
- Add credits/recaps/intro/preview detection
- Add multiples qualities for audio streams
- Improve multi-video support
- Add optional redis synchronization for replication (`RunLock` was made with this in mind)
- fmp4 support
- transcode downloads
