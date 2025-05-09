from __future__ import annotations

from logging import getLogger
from typing import Literal

from .client import KyooClient
from .models.videos import Guess
from .old.composite import CompositeProvider
from .utils import Model

logger = getLogger(__name__)


class Request(Model):
	kind: Literal["episode", "movie"]
	title: str
	year: int | None
	external_id: dict[str, str]
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
	def __init__(self, client: KyooClient, providers: CompositeProvider):
		self._client = client
		self._providers = providers

	async def process_scan_requests(self):
		# select for update skip_locked limit 1
		request: Request = ...

		if request.kind == "movie":
			movie = await self._providers.find_movie(
				request.title,
				request.year,
				request.external_id,
			)
			movie.videos = [x.id for x in request.videos]
			await self._client.create_movie(movie)
		else:
			serie = await self._providers.find_serie(
				request.title,
				request.year,
				request.external_id,
			)
			for vid in request.videos:
				for ep in vid.episodes:
					entry = next(
						(
							x
							for x in serie.entries
							if (ep.season is None and x.order == ep.episode)
							or (
								x.season_number == ep.season
								and x.episode_number == ep.episode
							)
						),
						None,
					)
					if entry is None:
						logger.warning(
							f"Couldn't match entry for {serie.slug} {ep.season or 'abs'}-e{ep.episode}."
						)
						continue
					entry.videos.append(vid.id)
			await self._client.create_serie(serie)
		# delete request
