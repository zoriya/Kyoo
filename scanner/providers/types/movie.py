import os
from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Optional

from .genre import Genre
from .status import Status


@dataclass
class MovieTranslation:
	name: str
	keywords: list[str] = field(default_factory=list)
	overview: Optional[str] = None


@dataclass
class Movie:
	aliases: list[str] = field(default_factory=list)
	release_date: Optional[datetime | int] = None
	status: Status = Status.UNKNOWN
	studio: Optional[int | str] = None
	genres: list[Genre] = field(default_factory=list)

	poster: list[str] = field(default_factory=list)
	thumbnails: list[str] = field(default_factory=list)
	logo: list[str] = field(default_factory=list)

	path: Optional[str] = None
	# TODO: handle staff
	# staff: list[Staff]

	translations: dict[str, MovieTranslation] = field(default_factory=dict)

	def to_kyoo(self):
		# For now, the API of kyoo only support one language so we remove the others.
		default_language = os.environ["LIBRARY_LANGUAGES"].split(",")[0]
		return {**asdict(self), **asdict(self.translations[default_language])}
