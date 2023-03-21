import os
from dataclasses import asdict, dataclass, field
from datetime import date
from typing import Optional

from .genre import Genre
from .status import Status


@dataclass
class MovieTranslation:
	name: str
	tagline: Optional[str] = None
	keywords: list[str] = field(default_factory=list)
	overview: Optional[str] = None

	posters: list[str] = field(default_factory=list)
	logos: list[str] = field(default_factory=list)
	trailers: list[str] = field(default_factory=list)



@dataclass
class Movie:
	aliases: list[str] = field(default_factory=list)
	release_date: Optional[date | int] = None
	status: Status = Status.UNKNOWN
	studios: list[str] = field(default_factory=list)
	genres: list[Genre] = field(default_factory=list)

	thumbnails: list[str] = field(default_factory=list)
	# Original poster in the show's language
	original_posters: list[str] = field(default_factory=list)

	path: Optional[str] = None
	# TODO: handle staff
	# staff: list[Staff]

	translations: dict[str, MovieTranslation] = field(default_factory=dict)

	def to_kyoo(self):
		# For now, the API of kyoo only support one language so we remove the others.
		default_language = os.environ["LIBRARY_LANGUAGES"].split(",")[0]
		return {
			**asdict(self),
			**asdict(self.translations[default_language]),
			"poster": next(iter(self.original_posters), None),
			"thumbnail": next(iter(self.thumbnails), None),
			"logo": next(iter(self.translations[default_language].logos), None),
			"trailer": next(iter(self.translations[default_language].trailers), None),
			"studio": next(iter(self.studios), None),
			"start_air": self.release_date,
			"title": self.translations[default_language].name,
			"isMovie": True,
		}
