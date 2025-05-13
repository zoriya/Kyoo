import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from scanner.client import KyooClient
from scanner.fsscan import FsScanner
from scanner.providers.composite import CompositeProvider
from scanner.providers.themoviedatabase import TheMovieDatabase
from scanner.requests import RequestCreator, RequestProcessor

from .database import get_db, init_pool, migrate
from .routers.routes import router

logging.basicConfig(level=logging.DEBUG)
logging.getLogger("watchfiles").setLevel(logging.WARNING)
logging.getLogger("rebulk").setLevel(logging.WARNING)


@asynccontextmanager
async def lifespan(_):
	async with (
		init_pool(),
		get_db() as db,
		KyooClient() as client,
		TheMovieDatabase() as tmdb,
	):
		await migrate();
		# creating the processor makes it listen to requests event in pg
		async with (
			RequestProcessor(db, client, CompositeProvider(tmdb)) as processor,
			get_db() as db,
		):
			scanner = FsScanner(client, RequestCreator(db))
			# there's no way someone else used the same id, right?
			is_master = await db.fetchval("select pg_try_advisory_lock(198347)")
			if is_master:
				_ = asyncio.create_task(scanner.monitor())
				_ = asyncio.create_task(scanner.scan(remove_deleted=True))
			yield


app = FastAPI(
	title="Scanner",
	description="API to control the long running scanner or interacting with external databases (themoviedb, tvdb...)\n\n"
	+ "Most of those APIs are for admins only.",
	root_path="/scanner",
	lifespan=lifespan,
)
app.include_router(router)
