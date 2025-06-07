from __future__ import annotations
from typing import Literal

from pydantic import Field

from .videos import Guess
from ..utils import Model


class Request(Model, extra="allow"):
	pk: int | None = Field(exclude=True, default=None)
	kind: Literal["episode", "movie"]
	title: str
	year: int | None
	external_id: dict[str, str]
	videos: list[Request.Video]

	class Video(Model):
		id: str
		episodes: list[Guess.Episode]
