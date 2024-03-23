from typing import Literal
from dataclasses import dataclass
from dataclasses_json import dataclass_json, LetterCase

from autosync.models.show import Show

from .metadataid import MetadataID


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class Episode:
	external_id: dict[str, MetadataID]
	show: Show
	season_number: int
	episode_number: int
	absolute_number: int
	kind: Literal["episode"]
