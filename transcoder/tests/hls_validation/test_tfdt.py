from __future__ import annotations

import pytest

from .hls_utils import (
    build_master_url,
    fetch_segment_bytes,
    fetch_text,
    parse_master_playlist,
    parse_media_playlist,
    read_fragment_base_decode_times,
    read_init_timescale,
)

# tfdt (baseMediaDecodeTime) is the decode time of a fragment's first sample. The
# segment muxer rebases every lazy window to its own start (tfdt ~= 0), and
# Stream.finalizeSegment shifts it back onto the absolute timeline. These tests
# read tfdt straight from the segment bytes (not the ffprobe-derived PTS the
# continuity tests use) so they assert that rebasing directly.

# tfdt is a *decode* time while EXTINF is a *presentation* duration; on B-frame
# content the first decoded sample can sit a few frames before the segment's
# presentation start, so absolute checks use a loose tolerance. The real
# regression (a window left rebased to ~0) is off by many seconds, far above it.
_ABS_TOL_SECONDS = 0.5
# Decode-time spacing between consecutive segments should match EXTINF closely.
_STEP_TOL_SECONDS = 0.1


def _expected_starts(durations: list[float]) -> list[float]:
    starts = [0.0]
    for d in durations[:-1]:
        starts.append(starts[-1] + d)
    return starts


def _first_tfdt_seconds(
    segment_url: str, timescale: int, test_config, byte_cache
) -> float:
    data = fetch_segment_bytes(
        segment_url,
        timeout_seconds=test_config.timeout_seconds,
        byte_cache=byte_cache,
        headers=test_config.headers,
    )
    tfdts = read_fragment_base_decode_times(data)
    assert tfdts, f"no moof/tfdt found in segment {segment_url}"
    # Every fragment in the segment must already be monotonically increasing
    # (Stream.finalizeSegment shifts them all by the same offset).
    assert tfdts == sorted(tfdts), (
        f"non-monotonic tfdt within segment {segment_url}: {tfdts}"
    )
    return tfdts[0] / timescale


def _load_timescale(playlist, test_config, byte_cache) -> int:
    assert playlist.map_url, f"playlist has no #EXT-X-MAP init segment: {playlist.url}"
    init = fetch_segment_bytes(
        playlist.map_url,
        timeout_seconds=test_config.timeout_seconds,
        byte_cache=byte_cache,
        headers=test_config.headers,
    )
    timescale = read_init_timescale(init)
    assert timescale > 0, f"invalid timescale {timescale} in {playlist.map_url}"
    return timescale


def test_tfdt_is_absolute_and_monotonic_across_sequential_segments(
    media_playlists: dict, test_config, byte_cache
) -> None:
    playlists = media_playlists["variants"] + media_playlists["audios"]
    assert playlists, "no playlists discovered"

    for playlist in playlists:
        if not playlist.map_url:
            # not an fMP4 stream, nothing to validate
            continue
        timescale = _load_timescale(playlist, test_config, byte_cache)

        count = min(len(playlist.segment_urls), test_config.max_segments)
        assert count >= 3, f"not enough segments in playlist {playlist.url}"
        expected = _expected_starts(playlist.segment_durations)

        tfdts = [
            _first_tfdt_seconds(
                playlist.segment_urls[i], timescale, test_config, byte_cache
            )
            for i in range(count)
        ]

        for i in range(count):
            assert abs(tfdts[i] - expected[i]) <= _ABS_TOL_SECONDS, (
                f"segment {i} tfdt={tfdts[i]:.6f}s not at absolute position "
                f"{expected[i]:.6f}s ({playlist.url})"
            )

        for i in range(1, count):
            step = tfdts[i] - tfdts[i - 1]
            want = playlist.segment_durations[i - 1]
            assert step > 0, (
                f"tfdt not increasing at segment {i} ({tfdts[i - 1]:.6f} -> "
                f"{tfdts[i]:.6f}) in {playlist.url}"
            )
            assert abs(step - want) <= _STEP_TOL_SECONDS, (
                f"tfdt step {step:.6f}s between segments {i - 1}->{i} does not "
                f"match EXTINF {want:.6f}s ({playlist.url})"
            )


def test_tfdt_absolute_after_lazy_window_seek(test_config, byte_cache) -> None:
    """Regression for Stream.finalizeSegment: a deep segment served by a *fresh*
    lazy window is rebased to that window's start by the muxer. Its tfdt must be
    patched back to its absolute timeline position, not left near ~0."""
    client_id = f"{test_config.client_prefix}-tfdt-seek"
    master_url = build_master_url(
        test_config.base_url, test_config.media_path, client_id
    )
    master_text = fetch_text(
        master_url,
        timeout_seconds=test_config.timeout_seconds,
        headers=test_config.headers,
    )
    variants, _ = parse_master_playlist(
        master_text, master_url=master_url, client_id=client_id
    )
    variants = list({v.url: v for v in variants}.values())
    assert variants, "no variants discovered"

    playlist = None
    for variant in variants:
        text = fetch_text(
            variant.url,
            timeout_seconds=test_config.timeout_seconds,
            headers=test_config.headers,
        )
        candidate = parse_media_playlist(text, variant.url, client_id)
        if candidate.map_url and len(candidate.segment_urls) >= 8:
            playlist = candidate
            break
    if playlist is None:
        pytest.skip("no fMP4 variant with enough segments to force a lazy window")

    timescale = _load_timescale(playlist, test_config, byte_cache)
    expected = _expected_starts(playlist.segment_durations)

    # Seek straight to the deepest segment for this fresh client. It is far from
    # the warmup window (anchored at t=0), so the transcoder spawns a new window
    # that the muxer rebases to ~0 -- exactly the case finalizeSegment must fix.
    target = len(playlist.segment_urls) - 1
    tfdt = _first_tfdt_seconds(
        playlist.segment_urls[target], timescale, test_config, byte_cache
    )

    assert abs(tfdt - expected[target]) <= _ABS_TOL_SECONDS, (
        f"deep segment {target} tfdt={tfdt:.6f}s is not at its absolute position "
        f"{expected[target]:.6f}s -- lazy window likely left unrebased "
        f"({playlist.url})"
    )
