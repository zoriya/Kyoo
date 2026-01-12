from asyncio import CancelledError, TaskGroup, create_task, sleep
from contextlib import asynccontextmanager

from fastapi import FastAPI

from scanner.client import KyooClient
from scanner.fsscan import FsScanner
from scanner.log import configure_logging
from scanner.otel import instrument, setup_otelproviders
from scanner.providers.composite import CompositeProvider
from scanner.providers.themoviedatabase import TheMovieDatabase
from scanner.providers.thetvdb import TVDB
from scanner.requests import RequestCreator, RequestProcessor

from .database import get_db, init_pool, migrate
from .routers.health import router as health_router
from .routers.routes import router


@asynccontextmanager
async def lifespan(_):
	async with (
		init_pool() as pool,
		get_db() as db,
		KyooClient() as client,
		TVDB() as tvdb,
		TheMovieDatabase() as tmdb,
	):
		# there's no way someone else used the same id, right?
		is_master = await db.fetchval("select pg_try_advisory_lock(198347)")
		is_http = not is_master and await db.fetchval(
			"select pg_try_advisory_lock(645633)"
		)
		if is_http:
			yield
			return
		if is_master:
			await migrate()
		processor = RequestProcessor(
			pool,
			client,
			CompositeProvider(tvdb, tmdb),
		)
		scanner = FsScanner(client, RequestCreator(db))
		tasks = create_task(
			background_startup(
				scanner,
				processor,
				is_master,
			)
		)
		yield
		_ = tasks.cancel()


async def background_startup(
	scanner: FsScanner,
	processor: RequestProcessor,
	is_master: bool | None,
):
	async def scan():
		# wait for everything to startup & resume before scanning
		await sleep(30)
		await scanner.scan(remove_deleted=True)

	async with TaskGroup() as tg:
		_ = tg.create_task(processor.listen(tg))
		if is_master:
			_ = tg.create_task(scanner.monitor())
			_ = tg.create_task(scan())


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
