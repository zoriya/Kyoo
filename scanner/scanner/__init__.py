from asyncio import CancelledError, Event, TaskGroup, create_task, sleep
from collections.abc import Awaitable, Callable
from contextlib import asynccontextmanager
from logging import getLogger

from asyncpg import Pool
from fastapi import FastAPI

from scanner.client import KyooClient
from scanner.fsscan import FsScanner
from scanner.log import configure_logging
from scanner.otel import instrument, setup_otelproviders
from scanner.providers.composite import CompositeProvider
from scanner.providers.themoviedatabase import TheMovieDatabase
from scanner.providers.thetvdb import TVDB
from scanner.refresh import ShowRefresh
from scanner.requests import RequestCreator, RequestProcessor

from .database import get_db, init_pool, migrate
from .routers.health import router as health_router
from .routers.routes import router

logger = getLogger(__name__)

MASTER_LOCK_ID = 198347
HTTP_LOCK_ID = 645633


@asynccontextmanager
async def lifespan(app: FastAPI):
	async with (
		init_pool() as pool,
		KyooClient() as client,
		TVDB() as tvdb,
		TheMovieDatabase() as tmdb,
	):
		app.state.pool = pool
		app.state.provider = CompositeProvider(tvdb, tmdb)
		await migrate()
		async with get_db() as db:
			await client.login(db)
		processor = RequestProcessor(pool, client, app.state.provider)
		requests = RequestCreator(pool)
		scanner = FsScanner(client, requests)
		refresh = ShowRefresh(client, requests)
		tasks = create_task(background_startup(pool, scanner, refresh, processor))
		yield
		_ = tasks.cancel()


async def background_startup(
	pool: Pool,
	scanner: FsScanner,
	refresh: ShowRefresh,
	processor: RequestProcessor,
):
	async def delay(task: Callable[[], Awaitable[None]]):
		# wait for everything to startup & resume before scanning
		await sleep(30)
		await task()

	async def leader_worker():
		while True:
			try:
				async with pool.acquire(timeout=10) as db:
					closed = Event()
					db.add_termination_listener(lambda _, closed=closed: closed.set())
					# there's no way someone else used the same id, right?
					while not await db.fetchval(
						f"select pg_try_advisory_lock({MASTER_LOCK_ID})"
					):
						await sleep(5)

					logger.info("Elected as master, starting scanner tasks")
					async with TaskGroup() as tg:
						_ = tg.create_task(scanner.monitor())
						_ = tg.create_task(
							delay(lambda: scanner.scan(remove_deleted=True))
						)
						_ = tg.create_task(delay(refresh.monitor))
						_ = await closed.wait()
						raise ConnectionError("Lost connection to the database")
			except Exception as e:
				logger.error("Lost the master lock, retrying in 5s", exc_info=e)
				await sleep(5)

	async with TaskGroup() as tg:
		_ = tg.create_task(processor.listen(tg))
		_ = tg.create_task(leader_worker())


async def cancel():
	raise CancelledError()


app = FastAPI(
	title="Scanner",
	description="API to control the long running scanner or interacting with external databases (themoviedb, tvdb...)\n\n"
	+ "Most of those APIs are for admins only.",
	root_path="/scanner",
	lifespan=lifespan,
)
app.include_router(router)
app.include_router(health_router)
configure_logging()
setup_otelproviders()
instrument(app)
