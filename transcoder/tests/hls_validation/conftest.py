from __future__ import annotations

import os
import shutil
import uuid
from dataclasses import dataclass

import pytest

from .hls_utils import (
    ByteCache,
    build_master_url,
    fetch_text,
    parse_master_playlist,
    parse_media_playlist,
)


@dataclass(frozen=True)
class TestConfig:
    base_url: str
    media_path: str
    client_prefix: str
    max_segments: int
    max_variant_playlists: int
    max_audio_playlists: int
    timeout_seconds: float
    headers: dict[str, str]


@pytest.fixture(scope="session")
def test_config() -> TestConfig:
    media_path = os.getenv("TRANSCODER_MEDIA_PATH", "").strip()
    if not media_path:
        raise pytest.UsageError(
            "TRANSCODER_MEDIA_PATH is required (absolute path as seen by transcoder)"
        )

    api_key = os.getenv("TRANSCODER_API_KEY", "").strip()
    auth_token = os.getenv("TRANSCODER_AUTH_TOKEN", "").strip()
    headers: dict[str, str] = {}
    if api_key:
        headers["X-Api-Key"] = api_key
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"

    return TestConfig(
        base_url=os.getenv(
            "TRANSCODER_BASE_URL", "http://localhost:7666/video"
        ).strip(),
        media_path=media_path,
        client_prefix=os.getenv("TRANSCODER_CLIENT_ID_PREFIX", "hls-test").strip(),
        max_segments=max(3, int(os.getenv("TRANSCODER_MAX_SEGMENTS", "14"))),
        max_variant_playlists=max(
            1, int(os.getenv("TRANSCODER_MAX_VARIANT_PLAYLISTS", "3"))
        ),
        max_audio_playlists=max(
            0, int(os.getenv("TRANSCODER_MAX_AUDIO_PLAYLISTS", "2"))
        ),
        timeout_seconds=float(os.getenv("TRANSCODER_TIMEOUT_SECONDS", "600")),
        headers=headers,
    )


@pytest.fixture(scope="session", autouse=True)
def ensure_ffprobe_available() -> None:
    if shutil.which("ffprobe") is None:
        raise pytest.UsageError("ffprobe is required in PATH")


@pytest.fixture(scope="session")
def byte_cache() -> ByteCache:
    return ByteCache()


@pytest.fixture
def client_id(test_config: TestConfig) -> str:
    return f"{test_config.client_prefix}-{uuid.uuid4().hex[:12]}"


@pytest.fixture
def master_context(test_config: TestConfig, client_id: str) -> dict:
    master_url = build_master_url(
        test_config.base_url, test_config.media_path, client_id
    )
    master_text = fetch_text(
        master_url,
        timeout_seconds=test_config.timeout_seconds,
        headers=test_config.headers,
    )
    variants, audios = parse_master_playlist(
        master_text, master_url=master_url, client_id=client_id
    )

    if not variants:
        raise AssertionError(f"No variants discovered in master playlist: {master_url}")

    dedup_variants = list({v.url: v for v in variants}.values())
    dedup_audios = list({a.url: a for a in audios}.values())

    return {
        "master_url": master_url,
        "variants": dedup_variants,
        "audios": dedup_audios,
        "client_id": client_id,
    }


@pytest.fixture
def media_playlists(master_context: dict, test_config: TestConfig) -> dict:
    variant_playlists = []
    for variant in master_context["variants"][: test_config.max_variant_playlists]:
        text = fetch_text(
            variant.url,
            timeout_seconds=test_config.timeout_seconds,
            headers=test_config.headers,
        )
        variant_playlists.append(
            parse_media_playlist(text, variant.url, master_context["client_id"])
        )

    audio_playlists = []
    for audio in master_context["audios"][: test_config.max_audio_playlists]:
        text = fetch_text(
            audio.url,
            timeout_seconds=test_config.timeout_seconds,
            headers=test_config.headers,
        )
        audio_playlists.append(
            parse_media_playlist(text, audio.url, master_context["client_id"])
        )

    return {
        "variants": variant_playlists,
        "audios": audio_playlists,
    }
