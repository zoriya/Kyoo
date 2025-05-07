from __future__ import annotations

from typing import Literal, Optional

from .models.videos import Guess
from .utils import Model


class Request(Model):
	kind: Literal["episode"] | Literal["movie"]
	title: str
	year: Optional[int]
	videos: list[Video]

	class Video(Model):
		id: str
		episodes: list[Guess.Episode]


async def enqueue(requests: list[Request]):
	# insert all requests
	# on conflict(kind,title,year) add to the `videos` list
	pass
