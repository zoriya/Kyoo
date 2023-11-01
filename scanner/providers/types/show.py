import os
from dataclasses import asdict, dataclass, field
from datetime import date
from typing import Optional
from enum import Enum

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
	tagline: Optional[str]
	tags: list[str]
	overview: Optional[str]

	posters: list[str]
	logos: list[str]
	trailers: list[str]
	thumbnails: list[str]


@dataclass
class Show:
	original_language: Optional[str]
	aliases: list[str]
	start_air: Optional[date | int]
	end_air: Optional[date | int]
	status: Status
	rating: int
	studios: list[Studio]
	genres: list[Genre]
	seasons: list[Season]
	# TODO: handle staff
	# staff: list[Staff]
	external_id: dict[str, MetadataID | None]

	translations: dict[str, ShowTranslation] = field(default_factory=dict)

	def to_kyoo(self):
		from providers.utils import select_image

		# For now, the API of kyoo only support one language so we remove the others.
		default_language = os.environ["LIBRARY_LANGUAGES"].split(",")[0]
		return {
			**asdict(self),
			**asdict(self.translations[default_language]),
			"studio": next((x.to_kyoo() for x in self.studios), None),
			"seasons": None,
			"poster": select_image(self, "posters"),
			"thumbnail": select_image(self, "thumbnails"),
			"logo": select_image(self, "logos"),
			"trailer": next(iter(self.translations[default_language].trailers), None),
			"genres": [x.to_kyoo() for x in self.genres],
		}
