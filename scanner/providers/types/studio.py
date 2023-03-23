from dataclasses import asdict, dataclass, field

from .metadataid import MetadataID


@dataclass
class Studio:
	name: str
	logos: list[str] = field(default_factory=list)
	external_id: dict[str, MetadataID] = field(default_factory=dict)

	def to_kyoo(self):
		return asdict(self)
