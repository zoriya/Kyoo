from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor

from .hls_utils import (
    assert_no_large_gaps_or_overlaps,
    build_master_url,
    fetch_text,
    parse_master_playlist,
    parse_media_playlist,
    probe_segment_timeline,
)


def _load_variant_playlists_for_client(test_config, client_id: str):
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
    unique_variants = list({v.url: v for v in variants}.values())
    playlists = []
    for variant in unique_variants:
        text = fetch_text(
            variant.url,
            timeout_seconds=test_config.timeout_seconds,
            headers=test_config.headers,
        )
        playlists.append(parse_media_playlist(text, variant.url, client_id=client_id))
    return playlists


def test_abr_switching_has_no_timeline_holes(
    master_context: dict, test_config, byte_cache
) -> None:
    playlists = []
    for variant in master_context["variants"]:
        text = fetch_text(
            variant.url,
            timeout_seconds=test_config.timeout_seconds,
            headers=test_config.headers,
        )
        playlists.append(
            parse_media_playlist(text, variant.url, master_context["client_id"])
        )

    if len(playlists) < 2:
        return

    selected = playlists[: min(3, len(playlists))]
    common_len = min(len(p.segment_urls) for p in selected)
    take = min(common_len, test_config.max_segments)
    assert take >= 4, "Need enough shared segments to validate ABR switching"

    timelines = []
    for seg_index in range(take):
        playlist = selected[seg_index % len(selected)]
        segment_url = playlist.segment_urls[seg_index]
        timelines.append(
            probe_segment_timeline(
                segment_url=segment_url,
                map_url=playlist.map_url,
                timeout_seconds=test_config.timeout_seconds,
                byte_cache=byte_cache,
                headers=test_config.headers,
            )
        )

    assert_no_large_gaps_or_overlaps(
        timelines=timelines,
        gap_tolerance_seconds=0.10,
        overlap_tolerance_seconds=0.10,
    )


def test_abr_switching_zigzag_pattern_has_no_timeline_holes(
    master_context: dict, test_config, byte_cache
) -> None:
    playlists = []
    for variant in master_context["variants"]:
        text = fetch_text(
            variant.url,
            timeout_seconds=test_config.timeout_seconds,
            headers=test_config.headers,
        )
        playlists.append(
            parse_media_playlist(text, variant.url, master_context["client_id"])
        )

    if len(playlists) < 2:
        return

    selected = playlists[: min(3, len(playlists))]
    original = next((p for p in selected if "/original/" in p.url), None)
    hd = next((p for p in selected if "/720p/" in p.url), None)
    if original is not None and hd is not None:
        selected = [original, hd]
    else:
        selected = selected[:2]

    common_len = min(len(p.segment_urls) for p in selected)
    assert common_len >= 7, "Need enough shared segments to validate zigzag ABR switching"

    switch_pattern = [0, 1, 0, 1, 0, 1]
    timelines = []
    for seg_index in range(1, 7):
        variant_index = switch_pattern[(seg_index - 1) % len(switch_pattern)]
        playlist = selected[variant_index]
        timelines.append(
            probe_segment_timeline(
                segment_url=playlist.segment_urls[seg_index],
                map_url=playlist.map_url,
                timeout_seconds=test_config.timeout_seconds,
                byte_cache=byte_cache,
                headers=test_config.headers,
            )
        )

    assert_no_large_gaps_or_overlaps(
        timelines=timelines,
        gap_tolerance_seconds=0.10,
        overlap_tolerance_seconds=0.10,
    )


def test_abr_lazy_window_boundaries_remain_continuous_after_sparse_seeks(
    master_context: dict, test_config, byte_cache
) -> None:
    playlists = []
    for variant in master_context["variants"]:
        text = fetch_text(
            variant.url,
            timeout_seconds=test_config.timeout_seconds,
            headers=test_config.headers,
        )
        playlists.append(
            parse_media_playlist(text, variant.url, master_context["client_id"])
        )

    if len(playlists) < 2:
        return

    selected = playlists[: min(3, len(playlists))]
    common_len = min(len(p.segment_urls) for p in selected)
    assert common_len >= 4, "Need at least 4 shared segments to stress lazy windows"

    sparse_prefetch = [
        (0, 0),
        (3, 0),
        (1, 1),
        (2, 2),
    ]
    for seg_index, variant_index in sparse_prefetch:
        playlist = selected[variant_index % len(selected)]
        probe_segment_timeline(
            segment_url=playlist.segment_urls[seg_index],
            map_url=playlist.map_url,
            timeout_seconds=test_config.timeout_seconds,
            byte_cache=byte_cache,
            headers=test_config.headers,
        )

    # Validate continuity in a contiguous playback window after sparse seeks.
    timelines = []
    switch_pattern = [1, 2, 0]
    for offset, seg_index in enumerate(range(1, 4)):
        playlist = selected[switch_pattern[offset] % len(selected)]
        timelines.append(
            probe_segment_timeline(
                segment_url=playlist.segment_urls[seg_index],
                map_url=playlist.map_url,
                timeout_seconds=test_config.timeout_seconds,
                byte_cache=byte_cache,
                headers=test_config.headers,
            )
        )

    assert_no_large_gaps_or_overlaps(
        timelines=timelines,
        gap_tolerance_seconds=0.10,
        overlap_tolerance_seconds=0.10,
    )


def test_seek_storm_contiguous_windows_stay_continuous(
    media_playlists: dict, test_config, byte_cache
) -> None:
    playlist = media_playlists["variants"][0]
    count = len(playlist.segment_urls)
    assert count >= 8, f"Need at least 8 segments for seek test, got {count}"

    mid = count // 2
    end = count - 1
    windows = [
        [0, 1, 2],
        [mid, min(mid + 1, end)],
        [3, 4],
        [max(0, end - 2), max(0, end - 1)],
        [mid],
    ]

    for window in windows:
        timelines = []
        for seg_index in window:
            timelines.append(
                probe_segment_timeline(
                    segment_url=playlist.segment_urls[seg_index],
                    map_url=playlist.map_url,
                    timeout_seconds=test_config.timeout_seconds,
                    byte_cache=byte_cache,
                    headers=test_config.headers,
                )
            )
        if len(timelines) > 1:
            assert_no_large_gaps_or_overlaps(
                timelines=timelines,
                gap_tolerance_seconds=0.08,
                overlap_tolerance_seconds=0.08,
            )


def test_concurrent_clients_can_seek_without_breaking_timeline(
    test_config, byte_cache
) -> None:
    worker_count = 3

    def worker(idx: int) -> None:
        client_id = f"{test_config.client_prefix}-concurrent-{idx}"
        playlists = _load_variant_playlists_for_client(test_config, client_id)
        if not playlists:
            raise AssertionError("No playlists discovered for concurrent client")

        playlist = playlists[0]
        count = len(playlist.segment_urls)
        if count < 6:
            raise AssertionError(
                f"Need at least 6 segments for concurrent worker, got {count}"
            )

        pattern = [0, count // 3, (2 * count) // 3, 1, 2, 3]
        timelines = []
        for seg_index in pattern:
            timelines.append(
                probe_segment_timeline(
                    segment_url=playlist.segment_urls[min(seg_index, count - 1)],
                    map_url=playlist.map_url,
                    timeout_seconds=test_config.timeout_seconds,
                    byte_cache=byte_cache,
                    headers=test_config.headers,
                )
            )

        assert_no_large_gaps_or_overlaps(
            timelines=timelines[-3:],
            gap_tolerance_seconds=0.08,
            overlap_tolerance_seconds=0.08,
        )

    with ThreadPoolExecutor(max_workers=worker_count) as pool:
        futures = [pool.submit(worker, i) for i in range(worker_count)]
        for f in futures:
            f.result()


def test_transcode_initial_window_does_not_truncate_future_segment(
    test_config, byte_cache
) -> None:
    client_id = f"{test_config.client_prefix}-initial-window"
    playlists = _load_variant_playlists_for_client(test_config, client_id)
    transcode = next((p for p in playlists if "/0/transcode/" in p.url), None)
    assert transcode is not None, "Expected a /0/transcode/ playlist"

    assert len(transcode.segment_urls) >= 3, "Need at least 3 transcode segments"
    expected = transcode.segment_durations[2]
    assert expected > 0, "Expected duration metadata for transcode segment 2"

    # Prime the stream with a tiny first-window request. Historically this could
    # leave ffmpeg running and create malformed future segments in the same encoder output.
    probe_segment_timeline(
        segment_url=transcode.segment_urls[0],
        map_url=transcode.map_url,
        timeout_seconds=test_config.timeout_seconds,
        byte_cache=byte_cache,
        headers=test_config.headers,
    )

    timeline = probe_segment_timeline(
        segment_url=transcode.segment_urls[2],
        map_url=transcode.map_url,
        timeout_seconds=test_config.timeout_seconds,
        byte_cache=byte_cache,
        headers=test_config.headers,
    )
    actual = timeline.end - timeline.start

    assert (
        actual >= expected - 0.8
    ), f"Transcode segment-2 appears truncated after initial-window run (actual={actual:.3f}s expected={expected:.3f}s)"
