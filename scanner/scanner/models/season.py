from __future__ import annotations

from datetime import date
from typing import Any

from pydantic import Field

from ..utils import Language, Model
from .metadataid import SeasonId


class Season(Model):
	season_number: int
	start_air: date | None
	end_air: date | None
	external_id: dict[str, SeasonId]
	translations: dict[Language, SeasonTranslation] = {}
	extra: dict[str, Any] = Field(exclude=True)


class SeasonTranslation(Model):
	name: str | None
	description: str | None
	poster: str | None
	thumbnail: str | None
	banner: str | None
