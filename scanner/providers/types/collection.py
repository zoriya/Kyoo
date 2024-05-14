from dataclasses import asdict, dataclass, field
from typing import Optional

from providers.utils import ProviderError, select_translation, select_image

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
		trans = select_translation(self)
		if trans is None:
			raise ProviderError(
				"Could not find translations for the collection. Aborting"
			)
		return {
			**asdict(self),
			**asdict(trans),
			"poster": select_image(self, "posters"),
			"thumbnail": select_image(self, "thumbnails"),
			"logo": select_image(self, "logos"),
		}
