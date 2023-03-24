import os
from dataclasses import asdict, dataclass, field
from datetime import date
from typing import Optional
from enum import Enum


from .genre import Genre
from .studio import Studio
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
	keywords: list[str] = field(default_factory=list)
	overview: Optional[str] = None

	posters: list[str] = field(default_factory=list)
	logos: list[str] = field(default_factory=list)
	trailers: list[str] = field(default_factory=list)
	thumbnails: list[str] = field(default_factory=list)


@dataclass
class Show:
	original_language: Optional[str] = None
	aliases: list[str] = field(default_factory=list)
	start_air: Optional[date | int] = None
	end_air: Optional[date | int] = None
	status: Status = Status.UNKNOWN
	studios: list[Studio] = field(default_factory=list)
	genres: list[Genre] = field(default_factory=list)
	# TODO: handle staff
	# staff: list[Staff]
	external_id: dict[str, MetadataID] = field(default_factory=dict)

	translations: dict[str, ShowTranslation] = field(default_factory=dict)

	def format_date(self, date: date | int | None) -> str | None:
		if date is None:
			return None
		if isinstance(date, int):
			return f"{date}-01-01T00:00:00Z"
		return date.isoformat()

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
			"logo": next(iter(self.translations[default_language].logos), None),
			"trailer": next(iter(self.translations[default_language].trailers), None),
			"studio": next(iter(x.to_kyoo() for x in self.studios), None),
			"startAir": self.format_date(self.start_air),
			"endAir": self.format_date(self.end_air),
			"title": self.translations[default_language].name,
			"genres": [x.to_kyoo() for x in self.genres],
		}
