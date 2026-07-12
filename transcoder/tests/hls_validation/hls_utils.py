from __future__ import annotations

import base64
import json
import subprocess
import tempfile
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from statistics import median
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse
from urllib.request import Request, urlopen


@dataclass(frozen=True)
class PlaylistVariant:
    url: str
    attrs: dict[str, str]


@dataclass(frozen=True)
class AudioRendition:
    url: str
    attrs: dict[str, str]


@dataclass(frozen=True)
class MediaPlaylist:
    url: str
    segment_urls: list[str]
    segment_durations: list[float]
    map_url: str | None


@dataclass(frozen=True)
class SegmentTimeline:
    segment_url: str
    stream_kind: str
    start: float
    end: float


def raw_b64url(value: str) -> str:
    return base64.urlsafe_b64encode(value.encode("utf-8")).decode("ascii").rstrip("=")


def with_query_param(url: str, key: str, value: str) -> str:
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query[key] = value
    new_query = urlencode(query)
    return urlunparse(
        (
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment,
        )
    )


def build_master_url(base_url: str, media_path: str, client_id: str) -> str:
    encoded = raw_b64url(media_path)
    base = base_url.rstrip("/")
    master = f"{base}/{encoded}/master.m3u8"
    return with_query_param(master, "clientId", client_id)


def fetch_text(
    url: str, timeout_seconds: float, headers: dict[str, str] | None = None
) -> str:
    req_headers = {"Accept": "application/vnd.apple.mpegurl,text/plain,*/*"}
    if headers:
        req_headers.update(headers)
    req = Request(url, headers=req_headers)
    with urlopen(req, timeout=timeout_seconds) as response:
        return response.read().decode("utf-8")


def fetch_binary(
    url: str, timeout_seconds: float, headers: dict[str, str] | None = None
) -> bytes:
    req = Request(url, headers=headers or {})
    with urlopen(req, timeout=timeout_seconds) as response:
        return response.read()


def _parse_attrs(line: str) -> dict[str, str]:
    _, payload = line.split(":", 1)
    out: dict[str, str] = {}
    current = ""
    parts: list[str] = []
    in_quotes = False
    for ch in payload:
        if ch == '"':
            in_quotes = not in_quotes
            current += ch
            continue
        if ch == "," and not in_quotes:
            parts.append(current)
            current = ""
            continue
        current += ch
    if current:
        parts.append(current)

    for part in parts:
        if "=" not in part:
            continue
        k, v = part.split("=", 1)
        out[k.strip()] = v.strip().strip('"')
    return out


def parse_master_playlist(
    text: str, master_url: str, client_id: str
) -> tuple[list[PlaylistVariant], list[AudioRendition]]:
    variants: list[PlaylistVariant] = []
    audios: list[AudioRendition] = []

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("#EXT-X-STREAM-INF:"):
            attrs = _parse_attrs(line)
            i += 1
            while i < len(lines) and lines[i].startswith("#"):
                i += 1
            if i < len(lines):
                uri = lines[i]
                url = with_query_param(urljoin(master_url, uri), "clientId", client_id)
                variants.append(PlaylistVariant(url=url, attrs=attrs))
        elif line.startswith("#EXT-X-MEDIA:"):
            attrs = _parse_attrs(line)
            if attrs.get("TYPE") == "AUDIO" and "URI" in attrs:
                url = with_query_param(
                    urljoin(master_url, attrs["URI"]), "clientId", client_id
                )
                audios.append(AudioRendition(url=url, attrs=attrs))
        i += 1

    return variants, audios


def parse_media_playlist(text: str, playlist_url: str, client_id: str) -> MediaPlaylist:
    map_url: str | None = None
    segment_urls: list[str] = []
    segment_durations: list[float] = []
    pending_duration: float | None = None

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for line in lines:
        if line.startswith("#EXTINF:"):
            payload = line.split(":", 1)[1]
            duration_raw = payload.split(",", 1)[0].strip()
            try:
                pending_duration = float(duration_raw)
            except ValueError:
                pending_duration = None
            continue
        if line.startswith("#EXT-X-MAP:"):
            attrs = _parse_attrs(line)
            map_uri = attrs.get("URI")
            if map_uri:
                map_url = with_query_param(
                    urljoin(playlist_url, map_uri), "clientId", client_id
                )
            continue
        if line.startswith("#"):
            continue
        segment_urls.append(
            with_query_param(urljoin(playlist_url, line), "clientId", client_id)
        )
        segment_durations.append(
            pending_duration if pending_duration is not None else 0.0
        )
        pending_duration = None

    return MediaPlaylist(
        url=playlist_url,
        segment_urls=segment_urls,
        segment_durations=segment_durations,
        map_url=map_url,
    )


class ByteCache:
    def __init__(self) -> None:
        self._cache: dict[str, bytes] = {}
        self._lock = threading.Lock()

    def get(
        self, url: str, timeout_seconds: float, headers: dict[str, str] | None = None
    ) -> bytes:
        with self._lock:
            if url in self._cache:
                return self._cache[url]
        content = fetch_binary(url, timeout_seconds, headers=headers)
        with self._lock:
            self._cache[url] = content
        return content


def _probe_packets(path: Path, stream_selector: str) -> list[dict]:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        stream_selector,
        "-show_packets",
        "-print_format",
        "json",
        str(path),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if proc.returncode != 0:
        return []
    data = json.loads(proc.stdout or "{}")
    return data.get("packets", [])


def _timeline_from_packets(
    segment_url: str, stream_kind: str, packets: list[dict]
) -> SegmentTimeline:
    pts_values = [float(p["pts_time"]) for p in packets if "pts_time" in p]
    dts_values = [float(p["dts_time"]) for p in packets if "dts_time" in p]
    starts = pts_values or dts_values
    if not starts:
        raise AssertionError(f"No pts/dts in packets for {segment_url}")

    start = min(starts)
    end_pts = max(starts)

    durations = [
        float(p["duration_time"])
        for p in packets
        if "duration_time" in p and float(p["duration_time"]) > 0
    ]
    default_step = median(durations) if durations else 0.04
    tail = durations[-1] if durations else default_step
    end = end_pts + max(tail, default_step)

    return SegmentTimeline(
        segment_url=segment_url, stream_kind=stream_kind, start=start, end=end
    )


def probe_segment_timeline(
    segment_url: str,
    map_url: str | None,
    timeout_seconds: float,
    byte_cache: ByteCache,
    headers: dict[str, str] | None = None,
    retries: int = 2,
    retry_delay_seconds: float = 0.7,
) -> SegmentTimeline:
    def get_with_retry(url: str) -> bytes:
        last_err: Exception | None = None
        for attempt in range(retries + 1):
            try:
                return byte_cache.get(url, timeout_seconds, headers=headers)
            except (TimeoutError, URLError, HTTPError) as err:
                last_err = err
                if attempt == retries:
                    break
                time.sleep(retry_delay_seconds * (attempt + 1))
        raise AssertionError(
            f"Failed to fetch segment after retries: {url} ({last_err})"
        )

    segment_bytes = get_with_retry(segment_url)
    prefix = get_with_retry(map_url) if map_url else b""

    with tempfile.TemporaryDirectory(prefix="hls-seg-") as td:
        seg_path = Path(td) / "sample.bin"
        seg_path.write_bytes(prefix + segment_bytes)

        packets_video = _probe_packets(seg_path, "v:0")
        if packets_video:
            return _timeline_from_packets(segment_url, "video", packets_video)

        packets_audio = _probe_packets(seg_path, "a:0")
        if packets_audio:
            return _timeline_from_packets(segment_url, "audio", packets_audio)

    raise AssertionError(f"ffprobe could not decode media packets for {segment_url}")


def fetch_segment_bytes(
    url: str,
    timeout_seconds: float,
    byte_cache: ByteCache,
    headers: dict[str, str] | None = None,
    retries: int = 2,
    retry_delay_seconds: float = 0.7,
) -> bytes:
    last_err: Exception | None = None
    for attempt in range(retries + 1):
        try:
            return byte_cache.get(url, timeout_seconds, headers=headers)
        except (TimeoutError, URLError, HTTPError) as err:
            last_err = err
            if attempt == retries:
                break
            time.sleep(retry_delay_seconds * (attempt + 1))
    raise AssertionError(f"Failed to fetch after retries: {url} ({last_err})")


def iter_boxes(data: bytes, start: int = 0, end: int | None = None):
    """Yield (type, box_start, header_len, total_size) for each top-level ISO-BMFF
    box within [start, end). Does not descend into containers."""
    if end is None:
        end = len(data)
    i = start
    while i + 8 <= end:
        size = int.from_bytes(data[i : i + 4], "big")
        btype = data[i + 4 : i + 8]
        header = 8
        if size == 1:
            if i + 16 > end:
                break
            size = int.from_bytes(data[i + 8 : i + 16], "big")
            header = 16
        elif size == 0:
            size = end - i
        if size < header or i + size > end:
            break
        yield btype, i, header, size
        i += size


def descend_box(
    data: bytes, path: list[bytes], start: int = 0, end: int | None = None
) -> tuple[int, int] | None:
    """Walk a container path (e.g. [b"moov", b"trak", b"mdia", b"mdhd"]) and return
    the (payload_start, payload_end) of the first matching leaf, or None."""
    rng = (start, len(data) if end is None else end)
    for want in path:
        found = None
        for btype, off, hdr, size in iter_boxes(data, rng[0], rng[1]):
            if btype == want:
                found = (off + hdr, off + size)
                break
        if found is None:
            return None
        rng = found
    return rng


def read_init_timescale(init_bytes: bytes) -> int:
    """Read the media (mdhd) timescale from an fMP4 init segment."""
    rng = descend_box(init_bytes, [b"moov", b"trak", b"mdia", b"mdhd"])
    if rng is None:
        raise AssertionError("init segment has no moov/trak/mdia/mdhd")
    p = rng[0]
    version = init_bytes[p]
    # payload: version(1) flags(3) then creation/modification (4 or 8 each) then timescale(4)
    ts_off = p + 4 + (16 if version == 1 else 8)
    return int.from_bytes(init_bytes[ts_off : ts_off + 4], "big")


def read_fragment_base_decode_times(segment_bytes: bytes) -> list[int]:
    """Return the tfdt baseMediaDecodeTime of every moof fragment in a media
    segment, in file order."""
    out: list[int] = []
    for btype, off, hdr, size in iter_boxes(segment_bytes):
        if btype != b"moof":
            continue
        rng = descend_box(segment_bytes, [b"traf", b"tfdt"], off + hdr, off + size)
        if rng is None:
            continue
        p = rng[0]
        version = segment_bytes[p]
        if version == 1:
            out.append(int.from_bytes(segment_bytes[p + 4 : p + 12], "big"))
        else:
            out.append(int.from_bytes(segment_bytes[p + 4 : p + 8], "big"))
    return out


def assert_no_large_gaps_or_overlaps(
    timelines: Iterable[SegmentTimeline],
    gap_tolerance_seconds: float,
    overlap_tolerance_seconds: float,
) -> None:
    ordered = list(timelines)
    if not ordered:
        raise AssertionError("No segment timelines to validate")

    previous = ordered[0]
    if previous.end <= previous.start:
        raise AssertionError(f"Invalid segment duration for {previous.segment_url}")

    for current in ordered[1:]:
        if current.end <= current.start:
            raise AssertionError(f"Invalid segment duration for {current.segment_url}")

        delta = current.start - previous.end
        if delta > gap_tolerance_seconds:
            raise AssertionError(
                "Detected playback gap between segments: "
                f"{previous.segment_url} -> {current.segment_url} (gap={delta:.6f}s)"
            )
        if delta < -overlap_tolerance_seconds:
            raise AssertionError(
                "Detected playback overlap/repeat between segments: "
                f"{previous.segment_url} -> {current.segment_url} (overlap={-delta:.6f}s)"
            )
        previous = current
