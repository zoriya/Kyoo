from datetime import date
from dataclasses import dataclass, field
from typing import Optional

from .show import Show
from .season import Season
from .metadataid import MetadataID


@dataclass
class EpisodeTranslation:
	name: str
	overview: Optional[str]
	thumbnails: list[str]

@dataclass
class Episode:
	show: Show | dict[str, MetadataID]
	season: Optional[Season]
	episode_number: Optional[int]
	absolute_number: Optional[int]
	release_date: Optional[date | int]
	path: Optional[str]
	external_id: dict[str, MetadataID]

	translations: dict[str, EpisodeTranslation] = field(default_factory=dict)
