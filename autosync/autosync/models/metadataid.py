from dataclasses import dataclass
from typing import Optional


@dataclass
class MetadataID:
	data_id: str
	link: Optional[str]
