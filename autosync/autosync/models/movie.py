from typing import Literal, Optional
from datetime import date
from dataclasses import dataclass

from .metadataid import MetadataID


@dataclass
class Movie:
	name: str
	air_date: Optional[date]
	external_id: dict[str, MetadataID]
	kind: Literal["movie"]

	@property
	def year(self):
		return self.air_date.year if self.air_date is not None else None
