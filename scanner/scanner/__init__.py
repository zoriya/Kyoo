from asyncio import CancelledError, TaskGroup, create_task, sleep
from contextlib import asynccontextmanager
from types import CoroutineType
from typing import Any

from asyncpg import Connection
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

MASTER_LOCK_ID = 198347
HTTP_LOCK_ID = 645633


@asynccontextmanager
async def lifespan(app: FastAPI):
	async with (
		init_pool(),
		get_db() as db,
		get_db() as leader_db,
		KyooClient() as client,
		TVDB() as tvdb,
		TheMovieDatabase() as tmdb,
	):
		app.state.provider = CompositeProvider(tvdb, tmdb)
		# there's no way someone else used the same id, right?
		is_master = await leader_db.fetchval(
			f"select pg_try_advisory_lock({MASTER_LOCK_ID})"
		)
		# # keep an instance only to answer http calls, idk if we really need it
		# is_http = not is_master and await db.fetchval(
		# 	f"select pg_try_advisory_lock({HTTP_LOCK_ID})"
		# )
		# if is_http:
		# 	yield
		# 	return
		if is_master:
			await migrate()
		processor = RequestProcessor(client, app.state.provider)
		requests = RequestCreator(db)
		scanner = FsScanner(client, requests)
		refresh = ShowRefresh(client, requests)
		tasks = create_task(
			background_startup(
				scanner,
				refresh,
				processor,
				leader_db,
				is_master,
			)
		)
		yield
		_ = tasks.cancel()


async def background_startup(
	scanner: FsScanner,
	refresh: ShowRefresh,
	processor: RequestProcessor,
	leader_db: Connection,
	is_master: bool | None,
):
	async def delay(task: CoroutineType[Any, Any, None]):
		# wait for everything to startup & resume before scanning
		await sleep(30)
		await task

	async def leader_worker(tg: TaskGroup):
		nonlocal is_master
		while not is_master:
			await sleep(5)
			is_master = await leader_db.fetchval(
				f"select pg_try_advisory_lock({MASTER_LOCK_ID})"
			)

		_ = tg.create_task(scanner.monitor())
		_ = tg.create_task(delay(scanner.scan(remove_deleted=True)))
		_ = tg.create_task(delay(refresh.monitor()))

	async with TaskGroup() as tg:
		_ = tg.create_task(processor.listen(tg))
		_ = tg.create_task(leader_worker(tg))


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
