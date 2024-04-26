import os
from datetime import date
from dataclasses import dataclass, field, asdict
from typing import Optional

from .metadataid import MetadataID


@dataclass
class SeasonTranslation:
	name: Optional[str] = None
	overview: Optional[str] = None
	posters: list[str] = field(default_factory=list)
	thumbnails: list[str] = field(default_factory=list)


@dataclass
class Season:
	season_number: int
	# This is not used by kyoo, this is just used internaly by the TMDB provider.
	# maybe this should be moved?
	episodes_count: Optional[int]
	start_air: Optional[date | int] = None
	end_air: Optional[date | int] = None
	external_id: dict[str, MetadataID] = field(default_factory=dict)

	show_id: Optional[str] = None
	translations: dict[str, SeasonTranslation] = field(default_factory=dict)

	def to_kyoo(self):
		# For now, the API of kyoo only support one language so we remove the others.
		default_language = os.environ["LIBRARY_LANGUAGES"].split(",")[0]
		return {
			**asdict(self),
			**asdict(self.translations[default_language]),
			"poster": next(iter(self.translations[default_language].posters), None),
			"thumbnail": next(
				iter(self.translations[default_language].thumbnails), None
			),
		}
