import os
from dataclasses import asdict, dataclass, field
from typing import Optional

from .metadataid import MetadataID


@dataclass
class CollectionTranslation:
	name: str
	overview: Optional[str] = None
	posters: list[str] = field(default_factory=list)
	logos: list[str] = field(default_factory=list)
	thumbnails: list[str] = field(default_factory=list)


@dataclass
class Collection:
	external_id: dict[str, MetadataID]
	translations: dict[str, CollectionTranslation] = field(default_factory=dict)

	def to_kyoo(self):
		# For now, the API of kyoo only support one language so we remove the others.
		default_language = os.environ["LIBRARY_LANGUAGES"].split(",")[0]
		return {
			**asdict(self),
			**asdict(self.translations[default_language]),
			"poster": next(iter(self.translations[default_language].posters), None),
			"thumbnail": next(
				iter(self.translations[default_language].thumbnails), None
			),
			"logo": next(iter(self.translations[default_language].logos), None),
		}
