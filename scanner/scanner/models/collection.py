from __future__ import annotations

from langcodes import Language

from ..utils import Model
from .genre import Genre
from .metadataid import MetadataId


class Collection(Model):
	slug: str
	original_language: Language
	genres: list[Genre]
	rating: int | None
	external_id: dict[str, MetadataId]

	translations: dict[str, CollectionTranslation] = {}


class CollectionTranslation(Model):
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
