from __future__ import annotations

from .hls_utils import fetch_text, parse_media_playlist, probe_segment_timeline


# Maximum allowed backward jump in timeline when crossing a lazy window boundary.
# A healthy stream should never reset its timeline by more than a few milliseconds.
MAX_BACKWARD_JUMP_SECONDS = 0.25


def test_video_pts_never_resets_across_lazy_windows(
    master_context: dict, test_config, byte_cache
) -> None:
    """
    Video segments must maintain continuous PTS across lazy window boundaries.

    Unlike test_continuity.py (which only samples ~14 segments within a single
    window), this test samples enough segments to cross multiple 100-segment
    lazy windows and verifies that the timeline never resets.

    This test documents a known fMP4 issue: each new encoder run writes
    window-relative tfdt and per-window init file state, causing timeline
    jumps when the init file is cached and later overwritten.
    """
    variant_playlists = []
    for variant in master_context["variants"]:
        text = fetch_text(
            variant.url,
            timeout_seconds=test_config.timeout_seconds,
            headers=test_config.headers,
        )
        variant_playlists.append(
            parse_media_playlist(text, variant.url, master_context["client_id"])
        )

    failures: list[str] = []

    for playlist in variant_playlists:
        if not playlist.segment_urls:
            continue

        total_extinf = 0.0
        # Video is more expensive to transcode than audio.
        # Sample just enough to cross one window boundary (100 -> 101).
        sample_count = min(len(playlist.segment_urls), 110)
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

            if drift < -MAX_BACKWARD_JUMP_SECONDS:
                failures.append(
                    f"{playlist.url} seg={idx}"
                    f" expected_start~{expected:.3f}s actual={timeline.start:.3f}s"
                    f" backward_jump={-drift:.3f}s"
                )
                break

            if idx < len(playlist.segment_durations):
                dur = playlist.segment_durations[idx]
                if dur > 0:
                    total_extinf += dur

    assert not failures, (
        "video timeline reset detected across lazy windows: " + ", ".join(failures)
    )
