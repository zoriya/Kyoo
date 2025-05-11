from __future__ import annotations

from logging import getLogger
from typing import Annotated, Literal

from asyncpg import Connection
from fastapi import Depends
from pydantic import Field

from .client import KyooClient
from .database import get_db
from .models.videos import Guess, Resource
from .providers.composite import CompositeProvider
from .utils import Model

logger = getLogger(__name__)


class Request(Model, extra="allow"):
	pk: int | None = Field(exclude=True, default=None)
	kind: Literal["episode", "movie"]
	title: str
	year: int | None
	external_id: dict[str, str]
	videos: list[Video]

	class Video(Model):
		id: str
		episodes: list[Guess.Episode]


class RequestCreator:
	def __init__(
		self,
		database: Annotated[Connection, Depends(get_db)],
	):
		self._database = database

	async def enqueue(self, requests: list[Request]):
		await self._database.executemany(
			"""
			insert into scanner.requests(kind, title, year, external_id, videos)
				values (%(kind)s, %(title) s, %(year)s, %(external_id)s, %(videos)s)
			on conflict (kind, title, year)
				do update set
					videos = videos || excluded.videos
			""",
			(x.model_dump() for x in requests),
		)
		_ = await self._database.execute("notify scanner.requests")


class RequestProcessor:
	def __init__(
		self,
		database: Annotated[Connection, Depends(get_db)],
		client: Annotated[KyooClient, Depends],
		providers: Annotated[CompositeProvider, Depends],
	):
		self._database = database
		self._client = client
		self._providers = providers

	async def listen_for_requests(self):
		logger.info("Listening for requestes")
		await self._database.add_listener("scanner.requests", self.process_request)

	async def process_request(self):
		cur = await self._database.fetchrow(
			"""
			update
				scanner.requests
			set
				status = 'running',
				started_at = nom()::timestamptz
			where
				pk in (
					select
						*
					from
						scanner.requests
					where
						status = 'pending'
					limit 1
					for update
						skip locked)
			returning
				*
			"""
		)
		if cur is None:
			return
		request = Request.model_validate(cur)

		logger.info(f"Starting to process {request.title}")
		try:
			show = await self._run_request(request)
			finished = await self._database.fetchrow(
				"""
				delete from scanner.requests
				where pk = %s
				returning
					videos
				""",
				[request.pk],
			)
			if finished and finished["videos"] != request.videos:
				await self._client.link_videos(show.slug, finished["videos"])
		except Exception as e:
			logger.error("Couldn't process request", exc_info=e)
			cur = await cur.execute(
				"""
				update
					scanner.requests
				set
					status = 'failed'
				where
					pk = %s
				""",
				[request.pk],
			)

	async def _run_request(self, request: Request) -> Resource:
		if request.kind == "movie":
			movie = await self._providers.find_movie(
				request.title,
				request.year,
				request.external_id,
			)
			movie.videos = [x.id for x in request.videos]
			return await self._client.create_movie(movie)

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
		return await self._client.create_serie(serie)
