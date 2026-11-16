from __future__ import annotations

from datetime import date
from typing import Literal

from .metadataid import MetadataId
from ..utils import Model


class Show(Model):
	id: str
	kind: Literal["movie", "serie", "collection"]
	name: str
	air_date: date | None = None
	start_air: date | None = None
	external_id: dict[str, list[MetadataId]]
