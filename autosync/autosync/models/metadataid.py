from msgspec import Struct
from typing import Optional


class MetadataID(Struct, rename="camel"):
	data_id: str
	link: Optional[str]


class EpisodeID(Struct, rename="camel"):
	show_id: str
	season: Optional[int]
	episode: int
	link: Optional[str]
