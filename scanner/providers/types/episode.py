import os
from datetime import date
from dataclasses import dataclass, field, asdict
from typing import Optional

from ..utils import format_date
from .show import Show
from .season import Season
from .metadataid import MetadataID


@dataclass
class PartialShow:
	name: str
	original_language: str
	external_id: dict[str, MetadataID]


@dataclass
class EpisodeTranslation:
	name: str
	overview: Optional[str]


@dataclass
class Episode:
	show: Show | PartialShow
	season_number: Optional[int]
	episode_number: Optional[int]
	absolute_number: Optional[int]
	release_date: Optional[date]
	thumbnail: Optional[str]
	external_id: dict[str, MetadataID]

	path: Optional[str] = None
	show_id: Optional[str] = None
	translations: dict[str, EpisodeTranslation] = field(default_factory=dict)


	def to_kyoo(self):
		# For now, the API of kyoo only support one language so we remove the others.
		default_language = os.environ["LIBRARY_LANGUAGES"].split(",")[0]
		return {
			**asdict(self),
			**asdict(self.translations[default_language]),
			"release_date": format_date(self.release_date),
		}
