from __future__ import annotations

from enum import StrEnum

from ..utils import Model
from .metadataid import MetadataId


class Role(StrEnum):
	ACTOR = "actor"
	DIRECTOR = "director"
	WRITTER = "writter"
	PRODUCER = "producer"
	MUSIC = "music"
	CREW = "crew"
	OTHER = "other"


class Staff(Model):
	kind: Role
	character: Character | None
	staff: Person


class Character(Model):
	name: str
	latin_name: str | None
	image: str | None


class Person(Model):
	slug: str
	name: str
	latin_name: str | None
	image: str | None
	external_id: dict[str, MetadataId]
