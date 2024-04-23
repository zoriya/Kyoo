from typing import Optional
from datetime import date
from msgspec import Struct

from .metadataid import MetadataID


class Movie(Struct, rename="camel", tag_field="kind", tag="movie"):
	name: str
	air_date: Optional[date]
	external_id: dict[str, MetadataID]

	@property
	def year(self):
		return self.air_date.year if self.air_date is not None else None
