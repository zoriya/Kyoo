import os
from datetime import date
from dataclasses import dataclass, field, asdict
from typing import Optional

from .show import Show
from .metadataid import MetadataID


@dataclass
class PartialShow:
	name: str
	original_language: Optional[str]
	external_id: dict[str, MetadataID]


@dataclass
class EpisodeID:
	show_id: str
	season: Optional[int]
	episode: int
	link: Optional[str]


@dataclass
class EpisodeTranslation:
	name: str
	overview: Optional[str]


@dataclass
class Episode:
	show: Show | PartialShow
	season_number: int
	episode_number: int
	absolute_number: int
	runtime: Optional[int]
	release_date: Optional[date | int]
	thumbnail: Optional[str]
	external_id: dict[str, EpisodeID]

	path: Optional[str] = None
	show_id: Optional[str] = None
	season_id: Optional[str] = None
	translations: dict[str, EpisodeTranslation] = field(default_factory=dict)

	def to_kyoo(self):
		# For now, the API of kyoo only support one language so we remove the others.
		default_language = os.environ["LIBRARY_LANGUAGES"].split(",")[0]
		return {
			**asdict(self),
			**asdict(self.translations[default_language]),
			"show": None,
		}
