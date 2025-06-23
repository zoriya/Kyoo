from __future__ import annotations

from typing import Any, Literal

from ..utils import Model
from .extra import ExtraKind
from .metadataid import EpisodeId, MetadataId


class Resource(Model):
	id: str
	slug: str


class VideoInfo(Model):
	paths: set[str]
	unmatched: set[str]
	guesses: dict[str, dict[str, Resource]]


class Guess(Model, extra="allow"):
	title: str
	kind: Literal["episode"] | Literal["movie"] | Literal["extra"]
	extra_kind: ExtraKind | None
	years: list[int]
	episodes: list[Guess.Episode]
	external_id: dict[str, str]
	raw: dict[str, Any] = {}

	from_: str
	history: list[Guess] = []

	class Episode(Model):
		season: int | None
		episode: int


_ = Guess.model_rebuild()


class For(Model):
	class Slug(Model):
		slug: str

	class ExternalId(Model):
		external_id: dict[str, MetadataId | EpisodeId]

	class Movie(Model):
		movie: str

	class Episode(Model):
		serie: str
		season: int
		episode: int

	class Order(Model):
		serie: str
		order: float

	class Special(Model):
		serie: str
		special: int


class Video(Model):
	path: str
	rendering: str
	part: int | None
	version: int = 1
	guess: Guess
	for_: list[
		For.Slug | For.ExternalId | For.Movie | For.Episode | For.Order | For.Special
	] = []


class VideoCreated(Model):
	id: str
	path: str
	guess: Guess
	entries: list[CreatedEntry]

	class CreatedEntry(Model):
		slug: str


class VideoLink(Model):
	id: str
	for_: list[
		For.Slug | For.ExternalId | For.Movie | For.Episode | For.Order | For.Special
	]
