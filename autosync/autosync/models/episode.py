from msgspec import Struct
from autosync.models.show import Show

from .metadataid import EpisodeID


class Episode(Struct, rename="camel", tag_field="kind", tag="episode"):
	external_id: dict[str, EpisodeID]
	show: Show
	season_number: int
	episode_number: int
	absolute_number: int
