from __future__ import annotations

from logging import getLogger
from typing import Literal

from psycopg import AsyncConnection
from psycopg.rows import class_row
from pydantic import Field

from .client import KyooClient
from .models.videos import Guess
from .providers.composite import CompositeProvider
from .utils import Model

logger = getLogger(__name__)


class Request(Model, extra="allow"):
	pk: int = Field(exclude=True)
	kind: Literal["episode", "movie"]
	title: str
	year: int | None
	external_id: dict[str, str]
	videos: list[Video]

	class Video(Model):
		id: str
		episodes: list[Guess.Episode]


class RequestProcessor:
	def __init__(
		self,
		database: AsyncConnection,
		client: KyooClient,
		providers: CompositeProvider,
	):
		self._database = database
		self._client = client
		self._providers = providers

	async def enqueue(self, requests: list[Request]):
		async with self._database.cursor() as cur:
			await cur.executemany(
				"""
				insert into scanner.requests(kind, title, year, external_id, videos)
					values (%(kind)s, %(title) s, %(year)s, %(external_id)s, %(videos)s)
				on conflict (kind, title, year)
					do update set
						videos = videos || excluded.videos
				""",
				(x.model_dump() for x in requests),
			)
			# TODO: how will this conflict be handled if the request is already locked for update (being processed)
			if cur.rowcount > 0:
				_ = await cur.execute("notify requests")

	async def process_requests(self):
		_ = await self._database.execute("listen requests")
		gen = self._database.notifies()
		async for _ in gen:
			await self._process_request()

	async def _process_request(self):
		async with self._database.cursor(row_factory=class_row(Request)) as cur:
			cur = await cur.execute(
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
			request = await cur.fetchone()
			if request is None:
				return

			logger.info(f"Starting to process {request.title}")
			try:
				await self._run_request(request)
				cur = await cur.execute(
					"""
					delete from scanner.requests
					where pk = %s
					""",
					[request.pk],
				)
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

	async def _run_request(self, request: Request):
		if request.kind == "movie":
			movie = await self._providers.find_movie(
				request.title,
				request.year,
				request.external_id,
			)
			movie.videos = [x.id for x in request.videos]
			await self._client.create_movie(movie)
			return

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
