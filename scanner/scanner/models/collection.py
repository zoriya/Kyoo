from dataclasses import asdict, dataclass, field
from typing import Optional

from providers.types.genre import Genre
from .metadataid import MetadataID


@dataclass
class CollectionTranslation:
	name: str
	descrpition: Optional[str]
	tagline: Optional[str]
	aliases: Optional[str]
	tags: Optional[str]

	posters: list[str]
	thumbnails: list[str]
	banner: list[str]
	logos: list[str]


@dataclass
class Collection:
	slug: str
	original_language: str
	genres: list[Genre]
	rating: Optional[int]
	external_id: dict[str, MetadataID]
	translations: dict[str, CollectionTranslation] = field(default_factory=dict)

	def to_kyoo(self):
		return asdict(self)
