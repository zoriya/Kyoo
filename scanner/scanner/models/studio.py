from __future__ import annotations

from ..utils import Model
from .metadataid import MetadataId


class Studio(Model):
	slug: str
	external_id: dict[str, MetadataId]
	translations: dict[str, StudioTranslation] = {}


class StudioTranslation(Model):
	name: str
	logo: str | None
