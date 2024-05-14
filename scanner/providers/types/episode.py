from datetime import date
from dataclasses import dataclass, field, asdict
from typing import Optional

from providers.utils import select_translation

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
	link: str


@dataclass
class EpisodeTranslation:
	name: Optional[str]
	overview: Optional[str] = None


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
		trans = select_translation(self) or EpisodeTranslation("")
		return {
			**asdict(self),
			**asdict(trans),
			"show": None,
		}
