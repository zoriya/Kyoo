from __future__ import annotations

from asyncio import CancelledError, Future, TaskGroup, sleep
from logging import getLogger
from types import TracebackType
from typing import Literal, cast

from asyncpg import Connection, Pool
from pydantic import Field, TypeAdapter

from .client import KyooClient
from .models.videos import Guess, Resource
from .providers.provider import Provider
from .utils import Model

logger = getLogger(__name__)


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


class RequestCreator:
	def __init__(self, database: Connection):
		self._database = database

	async def enqueue(self, requests: list[Request]):
		await self._database.executemany(
			"""
			insert into scanner.requests(kind, title, year, external_id, videos)
				values ($1, $2, $3, $4, $5)
			on conflict (kind, title, year)
				do update set
					videos = requests.videos || excluded.videos
			""",
			[
				[x["kind"], x["title"], x["year"], x["external_id"], x["videos"]]
				for x in TypeAdapter(list[Request]).dump_python(requests)
			],
		)
		_ = await self._database.execute("notify scanner_requests")

	async def clear_failed(self):
		_ = await self._database.execute(
			"""
			delete from scanner.requests
			where status = 'failed'
			"""
		)


class RequestProcessor:
	def __init__(
		self,
		database: Connection,
		client: KyooClient,
		providers: Provider,
	):
		self._database = database
		self._client = client
		self._providers = providers

	async def listen(self, tg: TaskGroup):
		def process(*_):
			_ = tg.create_task(self.process_all())

		try:
			logger.info("Listening for requestes")
			await self._database.add_listener("scanner_requests", process)
			await Future()
		except CancelledError as e:
			logger.info("Stopped listening for requsets")
			await self._database.remove_listener("scanner_requests", process)

	async def process_all(self):
		found = True
		while found:
			try:
				found = await self.process_request()
			except Exception as e:
				logger.error(
					"Failed to process one of the metadata request", exc_info=e
				)

	async def process_request(self):
		cur = await self._database.fetchrow(
			"""
			update
				scanner.requests
			set
				status = 'running',
				started_at = now()::timestamptz
			where
				pk in (
					select
						pk
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
		logger.warning("toto %s", cur)
		if cur is None:
			return False
		request = Request.model_validate(cur)

		logger.info(f"Starting to process {request.title}")
		try:
			show = await self._run_request(request)
			finished = await self._database.fetchrow(
				"""
				delete from scanner.requests
				where pk = $1
				returning
					videos
				""",
				[request.pk],
			)
			if finished and finished["videos"] != request.videos:
				await self._client.link_videos(show.slug, finished["videos"])
		except Exception as e:
			logger.error("Couldn't process request", exc_info=e)
			cur = await self._database.execute(
				"""
				update
					scanner.requests
				set
					status = 'failed'
				where
					pk = $1
				""",
				request.pk,
			)
		return True

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
