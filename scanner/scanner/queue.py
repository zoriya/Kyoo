from __future__ import annotations

from typing import Literal, Optional

from .client import KyooClient
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

	# notify

	# TODO: how will this conflict be handled if the request is already locked for update (being processed)
	pass

class RequestProcessor:
	def __init__(self, client: KyooClient):
		self._client = client

	async def process_scan_requests(self):
		# select for update skip_locked limit 1
		request: Request = ...

		if request.kind == "movie":
			movie = await providers.get_movie(request.title, request.year)
			movie.videos = request.videos
			await self._client.create_movie(movie)
		else:
			serie = await providers.get_serie(request.title, request.year)
			# for vid in request.videos:
			# 	for ep in vid.episodes:
					# entry = next(x for x in series.entries if (ep.season is None or x.season == ep.season), None)
			await self._client.create_serie(serie)
		# delete request
