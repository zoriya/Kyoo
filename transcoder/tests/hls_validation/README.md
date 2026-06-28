# HLS validation tests (Python)

This suite validates lazy transcoding behavior with a focus on:

- timeline continuity (no gaps, no repeated/overlapping playback windows)
- real playback patterns (sequential, ABR switches, seeks, concurrent clients)
- fMP4 `tfdt` correctness (absolute, monotonic decode times across lazy windows)

It is segment-container agnostic and does not assume `.ts` segments. Segment URLs are read from playlists and probed with `ffprobe` regardless of extension.

## Requirements

- Python 3.11+
- `ffprobe` available in `$PATH` (from FFmpeg)
- A running transcoder service
- A playable media file available under transcoder `GOCODER_SAFE_PATH`

Install Python deps:

```bash
uv pip install -r transcoder/tests/hls_validation/requirements.txt
```

## Environment variables

- `TRANSCODER_BASE_URL` (default: `http://localhost:7666/video`)
- `TRANSCODER_MEDIA_PATH` (required): absolute media path as seen by transcoder (example: `/video/movies/demo.mkv`)
- `TRANSCODER_CLIENT_ID_PREFIX` (default: `hls-test`)
- `TRANSCODER_MAX_SEGMENTS` (default: `14`)
- `TRANSCODER_MAX_VARIANT_PLAYLISTS` (default: `3`)
- `TRANSCODER_MAX_AUDIO_PLAYLISTS` (default: `2`)
- `TRANSCODER_TIMEOUT_SECONDS` (default: `40`)
- `TRANSCODER_API_KEY` (optional): if set, sent as `X-Api-Key` header for all requests

For your current setup with `docker-compose.dev.yml`, set `TRANSCODER_API_KEY=admin`.

## Run

```bash
pytest transcoder/tests/hls_validation -q
```

For `docker-compose.dev.yml` with API key auth via Traefik:

```bash
TRANSCODER_BASE_URL="http://localhost:8901/video" \
TRANSCODER_MEDIA_PATH="/video/The legend of korra S04E05.mkv" \
TRANSCODER_API_KEY="admin" \
uv run --with pytest pytest transcoder/tests/hls_validation -q
```
