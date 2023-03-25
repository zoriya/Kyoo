from dataclasses import dataclass
from typing import Optional


@dataclass
class MetadataID:
	id: str
	link: Optional[str]
