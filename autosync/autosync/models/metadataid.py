from dataclasses import dataclass
from dataclasses_json import dataclass_json, LetterCase
from typing import Optional


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class MetadataID:
	data_id: str
	link: Optional[str]
