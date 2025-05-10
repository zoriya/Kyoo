from __future__ import annotations

from datetime import date
from enum import StrEnum

from ..utils import Language, Model
from .collection import Collection
from .entry import Entry
from .extra import Extra
from .genre import Genre
from .metadataid import MetadataId
from .season import Season
from .staff import Staff
from .studio import Studio


class SerieStatus(StrEnum):
	UNKNOWN = "unknown"
	FINISHED = "finished"
	AIRING = "airing"
	PLANNED = "planned"


class Serie(Model):
	slug: str
	original_language: Language | None
	genres: list[Genre]
	rating: int | None
	status: SerieStatus
	runtime: int | None
	start_air: date | None
	end_air: date | None

	external_id: dict[str, MetadataId]
	translations: dict[Language, SerieTranslation] = {}
	seasons: list[Season] = []
	entries: list[Entry] = []
	extra: list[Extra] = []
	collections: list[Collection] = []
	studios: list[Studio] = []
	staff: list[Staff] = []


class SerieTranslation(Model):
	name: str
	latin_name: str | None
	description: str | None
	tagline: str | None
	aliases: list[str]
	tags: list[str]

	poster: str | None
	thumbnail: str | None
	banner: str | None
	logo: str | None
	trailer: str | None


class SearchSerie(Model):
	slug: str
	name: str
	description: str | None
	start_air: date | None
	end_air: date | None
	poster: str | None
	original_language: Language | None
	external_id: dict[str, MetadataId]
