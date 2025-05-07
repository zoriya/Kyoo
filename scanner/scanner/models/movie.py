from __future__ import annotations

from datetime import date
from enum import Enum

from langcodes import Language

from ..utils import Model
from .collection import Collection
from .genre import Genre
from .metadataid import MetadataId
from .staff import Staff
from .studio import Studio


class Status(str, Enum):
	UNKNOWN = "unknown"
	FINISHED = "finished"
	PLANNED = "planned"


class Movie(Model):
	slug: str
	original_language: Language | None
	genres: list[Genre]
	rating: int | None
	status: Status
	runtime: int | None
	air_date: date | None

	external_id: dict[str, MetadataId]
	translations: dict[str, MovieTranslation] = {}
	videos: list[str] = []
	collections: list[Collection] = []
	studios: list[Studio] = []
	staff: list[Staff] = []


class MovieTranslation(Model):
	name: str
	latin_name: str | None
	description: str | None
	tagline: str | None
	aliases: list[str]
	tags: list[str]

	posters: list[str]
	thumbnails: list[str]
	banner: list[str]
	logos: list[str]
	trailers: list[str]


class SearchMovie(Model):
	slug: str
	name: str
	description: str | None
	air_date: date | None
	poster: str
	original_language: Language | None
	external_id: dict[str, MetadataId]
