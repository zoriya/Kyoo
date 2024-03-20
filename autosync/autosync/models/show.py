from typing import Literal, Optional
from datetime import date
from dataclasses import dataclass

from .metadataid import MetadataID


@dataclass
class Show:
	name: str
	start_air: Optional[date]
	external_id: dict[str, MetadataID]
	kind: Literal["show"]

	@property
	def year(self):
		return self.start_air.year if self.start_air is not None else None
