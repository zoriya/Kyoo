from typing import Optional
from ..utils import Model


class MetadataId(Model):
	data_id: str
	link: Optional[str] = None


class EpisodeId(Model):
	serie_id: str
	season: Optional[int]
	episode: int
	link: Optional[str] = None
