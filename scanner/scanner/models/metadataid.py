from __future__ import annotations

from ..utils import Model


class MetadataId(Model):
	data_id: str
	link: str | None = None

	@classmethod
	def map_dict(cls, self: dict[str, MetadataId]):
		return {k: v.data_id for k, v in self.items()}


class SeasonId(Model):
	serie_id: str
	season: int
	link: str | None = None


class EpisodeId(Model):
	serie_id: str
	season: int | None
	episode: int
	link: str | None = None
