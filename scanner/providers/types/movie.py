import os
from dataclasses import asdict, dataclass, field
from datetime import date
from typing import Optional
from enum import Enum

from .collection import Collection
from .genre import Genre
from .studio import Studio
from .metadataid import MetadataID


class Status(str, Enum):
	UNKNOWN = "unknown"
	FINISHED = "finished"
	PLANNED = "planned"


@dataclass
class MovieTranslation:
	name: str
	tagline: Optional[str] = None
	tags: list[str] = field(default_factory=list)
	overview: Optional[str] = None

	posters: list[str] = field(default_factory=list)
	logos: list[str] = field(default_factory=list)
	trailers: list[str] = field(default_factory=list)
	thumbnails: list[str] = field(default_factory=list)


@dataclass
class Movie:
	original_language: Optional[str]
	aliases: list[str]
	air_date: Optional[date | int]
	status: Status
	rating: int
	runtime: Optional[int]
	studios: list[Studio]
	genres: list[Genre]
	# TODO: handle staff
	# staff: list[Staff]
	external_id: dict[str, MetadataID]

	path: Optional[str] = None
	collections: list[Collection] = field(default_factory=list)
	translations: dict[str, MovieTranslation] = field(default_factory=dict)

	def to_kyoo(self):
		from ..utils import select_image

		# For now, the API of kyoo only support one language so we remove the others.
		default_language = os.environ["LIBRARY_LANGUAGES"].split(",")[0]
		return {
			**asdict(self),
			**asdict(self.translations[default_language]),
			"poster": select_image(self, "posters"),
			"thumbnail": select_image(self, "thumbnails"),
			"logo": select_image(self, "logos"),
			"trailer": next(iter(self.translations[default_language].trailers), None),
			"studio": next((x.to_kyoo() for x in self.studios), None),
			"genres": [x.to_kyoo() for x in self.genres],
			"collections": None,
		}
