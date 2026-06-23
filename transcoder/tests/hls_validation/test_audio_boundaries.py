from __future__ import annotations

import time

from .hls_utils import (
    fetch_binary,
    fetch_text,
    parse_media_playlist,
    probe_segment_timeline,
)


def test_copied_audio_deep_seek_is_not_slow(master_context: dict, test_config) -> None:
    """Deep copied-audio seeks should not be slow enough to cause "segment never loads".

    This targets long copied-audio playlists where lazy generation requests a far segment.
    """
    max_allowed_fetch_seconds = 1.5
    min_segments_for_check = 1000
    failures: list[str] = []
    tested = 0

    for audio in master_context["audios"]:
        if "original" not in audio.url:
            continue

        text = fetch_text(
            audio.url,
            timeout_seconds=test_config.timeout_seconds,
            headers=test_config.headers,
        )
        playlist = parse_media_playlist(text, audio.url, master_context["client_id"])
        if len(playlist.segment_urls) < min_segments_for_check:
            continue

        tested += 1
        target_idx = min(
            int(len(playlist.segment_urls) * 0.85), len(playlist.segment_urls) - 2
        )

        started = time.monotonic()
        try:
            fetch_binary(
                playlist.segment_urls[target_idx],
                timeout_seconds=test_config.timeout_seconds,
                headers=test_config.headers,
            )
        except Exception as err:  # pragma: no cover - assertion path only
            failures.append(
                f"{audio.attrs.get('GROUP-ID', audio.url)}"
                f" seg={target_idx} fetch_failed={type(err).__name__}: {err}"
            )
            continue

        elapsed = time.monotonic() - started
        if elapsed > max_allowed_fetch_seconds:
            failures.append(
                f"{audio.attrs.get('GROUP-ID', audio.url)}"
                f" seg={target_idx} fetch_time={elapsed:.3f}s"
            )

    if tested == 0:
        return

    assert not failures, "copied-audio deep seek too slow: " + ", ".join(failures)


def test_audio_segment_100_boundary_is_continuous(
    master_context: dict, test_config, byte_cache
) -> None:
    if not master_context["audios"]:
        return

    max_allowed_discontinuity = 0.06
    failures: list[str] = []

    for audio in master_context["audios"]:
        text = fetch_text(
            audio.url,
            timeout_seconds=test_config.timeout_seconds,
            headers=test_config.headers,
        )
        playlist = parse_media_playlist(text, audio.url, master_context["client_id"])

        if len(playlist.segment_urls) <= 100:
            continue

        # Audio is transcoded lazily in 100-segment windows.
        # Verify continuity at each window boundary (99->100, 199->200, ...).
        boundaries = [i for i in range(100, len(playlist.segment_urls), 100)]
        for boundary in boundaries:
            before = probe_segment_timeline(
                segment_url=playlist.segment_urls[boundary - 1],
                map_url=playlist.map_url,
                timeout_seconds=test_config.timeout_seconds,
                byte_cache=byte_cache,
                headers=test_config.headers,
            )
            after = probe_segment_timeline(
                segment_url=playlist.segment_urls[boundary],
                map_url=playlist.map_url,
                timeout_seconds=test_config.timeout_seconds,
                byte_cache=byte_cache,
                headers=test_config.headers,
            )

            delta = after.start - before.end
            if abs(delta) > max_allowed_discontinuity:
                failures.append(
                    f"{audio.attrs.get('GROUP-ID', audio.url)}"
                    f" boundary={boundary - 1}->{boundary}"
                    f" delta={delta:.6f}s"
                )

    assert not failures, "audio discontinuity around lazy head boundary: " + ", ".join(
        failures
    )


def test_audio_pts_never_resets_across_lazy_windows(
    master_context: dict, test_config, byte_cache
) -> None:
    if not master_context["audios"]:
        return

    failures: list[str] = []
    max_allowed_backward_jump_seconds = 0.25

    for audio in master_context["audios"]:
        text = fetch_text(
            audio.url,
            timeout_seconds=test_config.timeout_seconds,
            headers=test_config.headers,
        )
        playlist = parse_media_playlist(text, audio.url, master_context["client_id"])
        if not playlist.segment_urls:
            continue

        total_extinf = 0.0
        # sample enough segments to cross several lazy windows
        sample_count = min(len(playlist.segment_urls), 340)
        for idx in range(sample_count):
            timeline = probe_segment_timeline(
                segment_url=playlist.segment_urls[idx],
                map_url=playlist.map_url,
                timeout_seconds=test_config.timeout_seconds,
                byte_cache=byte_cache,
                headers=test_config.headers,
            )
            expected = total_extinf
            drift = timeline.start - expected

            if drift < -max_allowed_backward_jump_seconds:
                failures.append(
                    f"{audio.attrs.get('GROUP-ID', audio.url)} seg={idx}"
                    f" expected_start~{expected:.3f}s actual={timeline.start:.3f}s"
                    f" backward_jump={-drift:.3f}s"
                )
                break

            if idx < len(playlist.segment_durations):
                dur = playlist.segment_durations[idx]
                if dur > 0:
                    total_extinf += dur

    assert not failures, (
        "audio timeline reset detected across lazy windows: " + ", ".join(failures)
    )
