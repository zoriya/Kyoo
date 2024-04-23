from typing import Optional
from datetime import date
from msgspec import Struct

from .metadataid import MetadataID


class Show(Struct, rename="camel", tag_field="kind", tag="show"):
	name: str
	start_air: Optional[date]
	external_id: dict[str, MetadataID]

	@property
	def year(self):
		return self.start_air.year if self.start_air is not None else None
