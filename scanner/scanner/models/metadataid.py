from ..utils import Model


class MetadataId(Model):
	data_id: str
	link: str | None = None


class SeasonId(Model):
	serie_id: str
	season: int
	link: str | None = None


class EpisodeId(Model):
	serie_id: str
	season: int | None
	episode: int
	link: str | None = None
