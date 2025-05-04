from dataclasses import asdict, dataclass, field
from datetime import date
from typing import Optional
from enum import Enum

from providers.utils import select_translation, select_image

from .genre import Genre
from .studio import Studio
from .season import Season
from .metadataid import MetadataID


class Status(str, Enum):
	UNKNOWN = "unknown"
	FINISHED = "finished"
	AIRING = "airing"
	PLANNED = "planned"


@dataclass
class ShowTranslation:
	name: str
	tagline: Optional[str] = None
	tags: list[str] = field(default_factory=list)
	overview: Optional[str] = None

	posters: list[str] = field(default_factory=list)
	logos: list[str] = field(default_factory=list)
	trailers: list[str] = field(default_factory=list)
	thumbnails: list[str] = field(default_factory=list)


@dataclass
class Show:
	original_language: Optional[str]
	aliases: list[str]
	start_air: Optional[date | int]
	end_air: Optional[date | int]
	status: Status
	rating: Optional[int]
	studios: list[Studio]
	genres: list[Genre]
	seasons: list[Season]
	# TODO: handle staff
	# staff: list[Staff]
	external_id: dict[str, MetadataID]

	translations: dict[str, ShowTranslation] = field(default_factory=dict)
	# The title of this show according to it's filename (None only for ease of use in providers)
	file_title: Optional[str] = None

	def to_kyoo(self):
		trans = select_translation(self) or ShowTranslation(name=self.file_title or "")
		return {
			**asdict(self),
			**asdict(trans),
			"rating": self.rating or 0,
			"studio": next((x.to_kyoo() for x in self.studios), None),
			"seasons": None,
			"poster": select_image(self, "posters"),
			"thumbnail": select_image(self, "thumbnails"),
			"logo": select_image(self, "logos"),
			"trailer": select_image(self, "trailers"),
			"genres": [x.to_kyoo() for x in self.genres],
			"file_title": None,
		}
