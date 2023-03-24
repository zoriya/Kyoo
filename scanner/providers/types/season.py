from datetime import date
from dataclasses import dataclass, field
from typing import Optional

from .show import Show
from .metadataid import MetadataID


@dataclass
class SeasonTranslation:
	name: Optional[str]
	overview: Optional[str]
	poster: list[str]
	thumbnails: list[str]


@dataclass
class Season:
	show: Show | dict[str, MetadataID]
	season_number: int
	start_date: Optional[date | int]
	end_date: Optional[date | int]
	external_id: dict[str, MetadataID]

	translations: dict[str, SeasonTranslation] = field(default_factory=dict)
