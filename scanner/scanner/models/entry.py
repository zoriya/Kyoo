from __future__ import annotations

from datetime import date
from typing import Literal

from ..utils import Model
from .metadataid import EpisodeId, MetadataId


class Entry(Model):
	kind: Literal["episode", "movie", "special"]
	order: float
	runtime: int | None = None
	air_date: date | None = None
	thumbnail: str | None = None

	# Movie-specific fields
	slug: str | None = None

	# Episode-specific fields
	season_number: int | None = None
	episode_number: int | None = None

	# Special-specific fields
	number: int | None = None

	externalId: dict[str, MetadataId | EpisodeId]
	translations: dict[str, EntryTranslation] = {}
	videos: list[str] = []


class EntryTranslation(Model):
	name: str | None = None
	description: str | None = None
	tagline: str | None = None
	poster: str | None = None
