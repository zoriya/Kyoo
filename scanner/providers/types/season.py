from datetime import date
from dataclasses import dataclass, field, asdict
from typing import Optional

from providers.utils import select_translation, select_image

from .metadataid import MetadataID


@dataclass
class SeasonTranslation:
	name: Optional[str] = None
	overview: Optional[str] = None
	posters: list[str] = field(default_factory=list)
	thumbnails: list[str] = field(default_factory=list)


@dataclass
class Season:
	season_number: int
	# This is not used by kyoo, this is just used internaly by the TMDB provider.
	# maybe this should be moved?
	episodes_count: int
	start_air: Optional[date | int] = None
	end_air: Optional[date | int] = None
	external_id: dict[str, MetadataID] = field(default_factory=dict)

	show_id: Optional[str] = None
	translations: dict[str, SeasonTranslation] = field(default_factory=dict)

	def to_kyoo(self):
		trans = select_translation(self) or SeasonTranslation()
		return {
			**asdict(self),
			**asdict(trans),
			"poster": select_image(self, "posters"),
			"thumbnail": select_image(self, "thumbnails"),
		}
