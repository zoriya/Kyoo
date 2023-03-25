import os
from datetime import date
from dataclasses import dataclass, field, asdict
from typing import Optional

from ..utils import format_date
from .metadataid import MetadataID


@dataclass
class SeasonTranslation:
	name: Optional[str]
	overview: Optional[str]
	posters: list[str]
	thumbnails: list[str]


@dataclass
class Season:
	season_number: int
	start_air: Optional[date | int]
	end_air: Optional[date | int]
	external_id: dict[str, MetadataID]

	translations: dict[str, SeasonTranslation] = field(default_factory=dict)

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
		}
