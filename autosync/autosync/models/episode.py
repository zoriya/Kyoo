from typing import Literal
from dataclasses import dataclass
from dataclasses_json import dataclass_json, LetterCase

from .metadataid import MetadataID

@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class Episode:
	external_id: dict[str, MetadataID]
	kind: Literal["episode"]
