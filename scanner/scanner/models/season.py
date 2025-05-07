from __future__ import annotations

from datetime import date

from ..utils import Model
from .metadataid import MetadataId


class Season(Model):
	season_number: int
	start_air: date | None
	end_air: date | None
	external_id: dict[str, MetadataId]
	translations: dict[str, SeasonTranslation] = {}


class SeasonTranslation(Model):
	name: str | None
	description: str | None
	poster: str | None
	thumbnail: str | None
	banner: str | None
