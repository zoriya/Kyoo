from dataclasses import dataclass
from typing import Optional


@dataclass
class MetadataID:
	data_id: str
	link: Optional[str]

	def __post_init__(self):
		self.data_id = str(self.data_id)
