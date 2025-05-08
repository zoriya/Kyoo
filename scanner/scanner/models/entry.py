from __future__ import annotations

from datetime import date
from typing import Literal

from langcodes import Language

from ..utils import Model
from .metadataid import EpisodeId, MetadataId


class Entry(Model):
	kind: Literal["episode", "movie", "special"]
	order: float
	runtime: int | None
	air_date: date | None
	thumbnail: str | None

	# Movie-specific fields
	slug: str | None

	# Episode-specific fields
	season_number: int | None
	episode_number: int | None

	# Special-specific fields
	number: int | None

	external_id: dict[str, MetadataId | EpisodeId]
	translations: dict[Language, EntryTranslation] = {}
	videos: list[str] = []


class EntryTranslation(Model):
	name: str | None
	description: str | None
	tagline: str | None
	poster: str | None
