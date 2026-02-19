from __future__ import annotations

from ..utils import Model


class MetadataId(Model):
	data_id: str
	link: str | None = None

	@classmethod
	def map_dict(cls, self: dict[str, MetadataId]):
		return {k: v.data_id for k, v in self.items()}

	@classmethod
	def merge(
		cls, self: dict[str, MetadataId], other: dict[str, MetadataId]
	) -> dict[str, MetadataId]:
		ret = other | self
		for k in set(self.keys()) & set(other.keys()):
			if ret[k].data_id == other[k].data_id and ret[k].link is None:
				ret[k].link = other[k].link
		return ret


class SeasonId(Model):
	serie_id: str
	season: int
	link: str | None = None


class EpisodeId(Model):
	serie_id: str
	season: int | None
	episode: int
	link: str | None = None
