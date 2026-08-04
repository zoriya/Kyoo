from __future__ import annotations

from pydantic import field_validator

from ..utils import Model


class MetadataId(Model):
	data_id: str
	link: str | None = None
	label: str | None = None

	@field_validator("link")
	@classmethod
	def _clean_link(cls, link: str | None) -> str | None:
		# Provider data sometimes contains stray whitespace (e.g. a trailing tab
		# in a thetvdb people url), which makes the link fail the api's url
		# validation and rejects the whole serie/movie with a 422.
		if link is None:
			return None
		link = link.strip()
		return link or None

	@classmethod
	def map_dict(cls, self: dict[str, list[MetadataId]]):
		return {k: v[0].data_id for k, v in self.items()}

	@classmethod
	def merge(
		cls,
		self: dict[str, list[MetadataId]],
		other: dict[str, list[MetadataId]],
	) -> dict[str, list[MetadataId]]:
		ret = other | self
		for k in set(self.keys()) & set(other.keys()):
			for x in ret[k]:
				if x.link is not None:
					continue
				o = next((ox for ox in other[k] if ox.data_id == x.data_id), None)
				if o:
					x = o.link
		return ret


class SeasonId(Model):
	serie_id: str
	season: int
	link: str | None = None
	label: str | None = None


class EpisodeId(Model):
	serie_id: str
	season: int | None
	episode: int
	link: str | None = None
