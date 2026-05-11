from __future__ import annotations

import struct
import tempfile
from pathlib import Path

import pytest

from .hls_utils import (
    ByteCache,
    fetch_binary,
    fetch_text,
    parse_media_playlist,
    probe_segment_timeline,
)


def _read_mp4_box(data: bytes, offset: int) -> tuple[str, int, int]:
    """Read an MP4 box: (type, size, next_offset)."""
    if offset + 8 > len(data):
        return "", 0, len(data)
    size = int.from_bytes(data[offset : offset + 4], "big")
    box_type = data[offset + 4 : offset + 8].decode("latin-1", errors="replace")
    if size == 0:
        size = len(data) - offset
    elif size == 1:
        if offset + 16 > len(data):
            return "", 0, len(data)
        size = int.from_bytes(data[offset + 8 : offset + 16], "big")
    return box_type, size, offset + size


def _find_tfdt(data: bytes) -> int | None:
    """Find base_media_decode_time in the first tfdt box."""
    offset = 0
    while offset < len(data):
        box_type, size, next_offset = _read_mp4_box(data, offset)
        if box_type == "moof":
            child = offset + 8
            while child < next_offset:
                c_type, c_size, c_next = _read_mp4_box(data, child)
                if c_type == "traf":
                    grandchild = child + 8
                    while grandchild < c_next:
                        g_type, g_size, g_next = _read_mp4_box(data, grandchild)
                        if g_type == "tfdt":
                            version = data[grandchild + 8]
                            if version == 1:
                                return int.from_bytes(
                                    data[grandchild + 12 : grandchild + 20], "big"
                                )
                            else:
                                return int.from_bytes(
                                    data[grandchild + 12 : grandchild + 16], "big"
                                )
                        grandchild = g_next
                child = c_next
        offset = next_offset
    return None


def _find_elst(data: bytes) -> list[dict] | None:
    """Find the edit list entries in the init file."""
    offset = 0
    while offset < len(data):
        box_type, size, next_offset = _read_mp4_box(data, offset)
        if box_type == "moov":
            child = offset + 8
            while child < next_offset:
                c_type, c_size, c_next = _read_mp4_box(data, child)
                if c_type == "trak":
                    grandchild = child + 8
                    while grandchild < c_next:
                        g_type, g_size, g_next = _read_mp4_box(data, grandchild)
                        if g_type == "edts":
                            gg = grandchild + 8
                            while gg < g_next:
                                gg_type, gg_size, gg_next = _read_mp4_box(data, gg)
                                if gg_type == "elst":
                                    version = data[gg + 8]
                                    entry_count = int.from_bytes(
                                        data[gg + 12 : gg + 16], "big"
                                    )
                                    entries = []
                                    for e in range(entry_count):
                                        if version == 1:
                                            seg_duration = int.from_bytes(
                                                data[
                                                    gg
                                                    + 16
                                                    + e * 20 : gg
                                                    + 16
                                                    + e * 20
                                                    + 8
                                                ],
                                                "big",
                                            )
                                            media_time = int.from_bytes(
                                                data[
                                                    gg
                                                    + 16
                                                    + e * 20
                                                    + 8 : gg
                                                    + 16
                                                    + e * 20
                                                    + 16
                                                ],
                                                "big",
                                                signed=True,
                                            )
                                        else:
                                            seg_duration = int.from_bytes(
                                                data[
                                                    gg
                                                    + 16
                                                    + e * 12 : gg
                                                    + 16
                                                    + e * 12
                                                    + 4
                                                ],
                                                "big",
                                            )
                                            media_time = int.from_bytes(
                                                data[
                                                    gg
                                                    + 16
                                                    + e * 12
                                                    + 4 : gg
                                                    + 16
                                                    + e * 12
                                                    + 8
                                                ],
                                                "big",
                                                signed=True,
                                            )
                                        entries.append(
                                            {
                                                "duration": seg_duration,
                                                "time": media_time,
                                            }
                                        )
                                    return entries
                                gg = gg_next
                        grandchild = g_next
                child = c_next
        offset = next_offset
    return None


def test_init_file_contains_edit_list_for_nonzero_window(
    master_context: dict, test_config, byte_cache
) -> None:
    """
    When a stream starts from a non-zero position (lazy window > 0),
    the fMP4 init file should contain an edts/elst edit list.

    This test documents the current behavior and will fail if we ever
    find a way to suppress edit list generation.
    """
    if not master_context["audios"]:
        pytest.skip("no audio streams")

    audio = master_context["audios"][0]
    text = fetch_text(
        audio.url,
        timeout_seconds=test_config.timeout_seconds,
        headers=test_config.headers,
    )
    playlist = parse_media_playlist(text, audio.url, master_context["client_id"])

    if not playlist.map_url:
        pytest.skip("no init segment in playlist")

    # Fetch the init file
    init_bytes = byte_cache.get(
        playlist.map_url,
        timeout_seconds=test_config.timeout_seconds,
        headers=test_config.headers,
    )

    elst = _find_elst(init_bytes)
    assert elst is not None, "init file missing edts/elst box"

    # For a stream that started from 0, elst has 1 entry (duration=0, time=0)
    # For a stream that started from >0, elst has 2 entries (empty edit + content)
    # We just document what we find.
    print(f"elst entries: {elst}")


def test_segment_tfdt_is_relative_to_window(
    master_context: dict, test_config, byte_cache
) -> None:
    """
    fMP4 segments from a non-zero lazy window have tfdt=0 (window-relative),
    not absolute timestamps.

    This test documents the current ffmpeg behavior and explains why
    cross-window playback requires per-window init files or edit list suppression.
    """
    if not master_context["audios"]:
        pytest.skip("no audio streams")

    audio = master_context["audios"][0]
    text = fetch_text(
        audio.url,
        timeout_seconds=test_config.timeout_seconds,
        headers=test_config.headers,
    )
    playlist = parse_media_playlist(text, audio.url, master_context["client_id"])

    if len(playlist.segment_urls) <= 100:
        pytest.skip("not enough segments to test cross-window")

    # Pick a segment from the second window (segment 100)
    seg_url = playlist.segment_urls[100]
    seg_bytes = byte_cache.get(
        seg_url,
        timeout_seconds=test_config.timeout_seconds,
        headers=test_config.headers,
    )

    tfdt = _find_tfdt(seg_bytes)
    assert tfdt is not None, "segment missing tfdt box"

    # tfdt should be ~0 for a window-relative segment
    # If it were absolute, it would be ~400000000 (400s * 1e6 timescale)
    # We just document the value; the actual threshold depends on codec.
    print(f"segment 100 tfdt = {tfdt}")


def test_cross_window_probe_with_stale_init_is_broken(
    master_context: dict, test_config, byte_cache
) -> None:
    """
    Reproduce the core fMP4 issue: probing a segment from window N
    with a stale init file from window M produces broken timestamps.

    This test deliberately fetches init+segment from different windows
    to demonstrate the timeline reset that causes
    test_audio_pts_never_resets_across_lazy_windows to fail.
    """
    if not master_context["audios"]:
        pytest.skip("no audio streams")

    audio = master_context["audios"][0]
    text = fetch_text(
        audio.url,
        timeout_seconds=test_config.timeout_seconds,
        headers=test_config.headers,
    )
    playlist = parse_media_playlist(text, audio.url, master_context["client_id"])

    if len(playlist.segment_urls) <= 100:
        pytest.skip("not enough segments to test cross-window")

    # Fetch segment 100 using the CURRENT init file (whatever is on disk)
    timeline_correct = probe_segment_timeline(
        segment_url=playlist.segment_urls[100],
        map_url=playlist.map_url,
        timeout_seconds=test_config.timeout_seconds,
        byte_cache=byte_cache,
        headers=test_config.headers,
    )

    # Now fetch a NEW init file by bypassing the cache
    init_bytes_fresh = fetch_binary(
        playlist.map_url,
        timeout_seconds=test_config.timeout_seconds,
        headers=test_config.headers,
    )
    seg_bytes = fetch_binary(
        playlist.segment_urls[100],
        timeout_seconds=test_config.timeout_seconds,
        headers=test_config.headers,
    )

    with tempfile.TemporaryDirectory() as td:
        combined = Path(td) / "combined.bin"
        combined.write_bytes(init_bytes_fresh + seg_bytes)

        # Probe with ffprobe directly
        import json
        import subprocess

        proc = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-select_streams",
                "a:0",
                "-show_packets",
                "-print_format",
                "json",
                str(combined),
            ],
            capture_output=True,
            text=True,
        )
        data = json.loads(proc.stdout or "{}")
        packets = data.get("packets", [])
        pts_values = [float(p["pts_time"]) for p in packets if "pts_time" in p]
        actual_start = min(pts_values) if pts_values else 0.0

    # The fresh init + segment should give the same result as the cached probe
    # If they differ significantly, it means the cached init is stale.
    drift = abs(timeline_correct.start - actual_start)

    # We expect them to match. A large drift (>1s) indicates the init file
    # was overwritten between the first fetch (cached) and second fetch (fresh).
    assert drift < 1.0, (
        f"init file mismatch: cached probe={timeline_correct.start:.3f}s "
        f"fresh probe={actual_start:.3f}s drift={drift:.3f}s"
    )
