from typing import Literal
from dataclasses import dataclass

from .metadataid import MetadataID


@dataclass
class Episode:
	external_id: dict[str, MetadataID]
	kind: Literal["episode"]
