from __future__ import annotations

from urllib.parse import urlparse

from .hls_utils import (
    ByteCache,
    fetch_binary,
    parse_media_playlist,
    probe_segment_timeline,
)


def test_playlists_reference_init_segment(
    media_playlists: dict, test_config
) -> None:
    """Every fMP4 media playlist must contain an #EXT-X-MAP tag."""
    failures: list[str] = []
    for playlist in media_playlists["variants"] + media_playlists["audios"]:
        if playlist.map_url is None:
            failures.append(f"{playlist.url}: missing #EXT-X-MAP")
    assert not failures, "missing init map in playlists: " + ", ".join(failures)


def test_init_segment_is_fetchable(
    media_playlists: dict, test_config, byte_cache: ByteCache
) -> None:
    """The init segment referenced by #EXT-X-MAP must be downloadable."""
    failures: list[str] = []
    for playlist in media_playlists["variants"] + media_playlists["audios"]:
        if playlist.map_url is None:
            continue
        try:
            data = byte_cache.get(
                playlist.map_url,
                timeout_seconds=test_config.timeout_seconds,
                headers=test_config.headers,
            )
            if len(data) < 20:
                failures.append(
                    f"{playlist.map_url}: too small ({len(data)} bytes)"
                )
        except Exception as exc:
            failures.append(f"{playlist.map_url}: {exc}")
    assert not failures, "init segment fetch failed: " + ", ".join(failures)


def test_init_segment_starts_with_ftyp(
    media_playlists: dict, test_config, byte_cache: ByteCache
) -> None:
    """fMP4 init segments must contain an ftyp box in the first 1KB."""
    failures: list[str] = []
    for playlist in media_playlists["variants"] + media_playlists["audios"]:
        if playlist.map_url is None:
            continue
        try:
            data = byte_cache.get(
                playlist.map_url,
                timeout_seconds=test_config.timeout_seconds,
                headers=test_config.headers,
            )
            if b"ftyp" not in data[:1024]:
                failures.append(
                    f"{playlist.map_url}: no ftyp box in first 1KB"
                )
        except Exception as exc:
            failures.append(f"{playlist.map_url}: {exc}")
    assert not failures, "invalid init segments: " + ", ".join(failures)


def test_segments_are_m4s(
    media_playlists: dict, test_config
) -> None:
    """All segment URLs should end with .m4s after the fMP4 migration."""
    failures: list[str] = []
    for playlist in media_playlists["variants"] + media_playlists["audios"]:
        for url in playlist.segment_urls:
            path = urlparse(url).path
            if not path.endswith(".m4s"):
                failures.append(f"{url}: does not end with .m4s")
                break
    assert not failures, "non-.m4s segments found: " + ", ".join(failures)
