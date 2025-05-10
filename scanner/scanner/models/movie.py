from __future__ import annotations

from datetime import date
from enum import StrEnum

from ..utils import Language, Model
from .collection import Collection
from .genre import Genre
from .metadataid import MetadataId
from .staff import Staff
from .studio import Studio


class MovieStatus(StrEnum):
	UNKNOWN = "unknown"
	FINISHED = "finished"
	PLANNED = "planned"


class Movie(Model):
	slug: str
	original_language: Language | None
	genres: list[Genre]
	rating: int | None
	status: MovieStatus
	runtime: int | None
	air_date: date | None

	external_id: dict[str, MetadataId]
	translations: dict[Language, MovieTranslation] = {}
	collections: list[Collection] = []
	studios: list[Studio] = []
	staff: list[Staff] = []
	videos: list[str] = []


class MovieTranslation(Model):
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


class SearchMovie(Model):
	slug: str
	name: str
	description: str | None
	air_date: date | None
	poster: str | None
	original_language: Language | None
	external_id: dict[str, MetadataId]
