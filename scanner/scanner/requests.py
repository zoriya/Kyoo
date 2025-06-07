from asyncio import CancelledError, Event, TaskGroup
from logging import getLogger
from typing import cast

from asyncpg import Connection, Pool
from pydantic import TypeAdapter

from .client import KyooClient
from .models.request import Request
from .models.videos import Resource
from .providers.provider import Provider

logger = getLogger(__name__)


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
		pool: Pool,
		client: KyooClient,
		providers: Provider,
	):
		self._pool = pool
		self._database: Connection = None  # type: ignore
		self._client = client
		self._providers = providers

	async def listen(self, tg: TaskGroup):
		closed = Event()

		def process(*_):
			_ = tg.create_task(self.process_all())

		def terminated(*_):
			closed.set()

		while True:
			closed.clear()
			# TODO: unsure if timeout actually work, i think not...
			async with self._pool.acquire(timeout=10) as db:
				try:
					self._database = cast(Connection, db)
					self._database.add_termination_listener(terminated)
					await self._database.add_listener("scanner_requests", process)

					logger.info("Listening for requestes")
					_ = await closed.wait()
					logger.info("stopping...")
				except CancelledError:
					logger.info("Stopped listening for requsets")
					await self._database.remove_listener("scanner_requests", process)
					self._database.remove_termination_listener(terminated)
					raise

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
				request.pk,
			)
			if finished and finished["videos"] != request.videos:
				videos = TypeAdapter(list[Request.Video]).validate_python(
					finished["videos"]
				)
				await self._client.link_videos(
					"movie" if request.kind == "movie" else "serie",
					show.slug,
					videos,
				)
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
