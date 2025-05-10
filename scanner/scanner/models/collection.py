from __future__ import annotations

from ..utils import Language, Model
from .genre import Genre
from .metadataid import MetadataId


class Collection(Model):
	slug: str
	original_language: Language | None
	genres: list[Genre]
	rating: int | None
	external_id: dict[str, MetadataId]

	translations: dict[Language, CollectionTranslation] = {}


class CollectionTranslation(Model):
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
