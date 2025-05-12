import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from scanner.client import KyooClient
from .database import get_db, init_pool
from scanner.fsscan import Scanner
from scanner.providers.composite import CompositeProvider
from scanner.providers.themoviedatabase import TheMovieDatabase
from scanner.requests import RequestCreator, RequestProcessor

logging.basicConfig(level=logging.INFO)
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
		processor = RequestProcessor(db, client, CompositeProvider(tmdb))
		await processor.listen_for_requests()
		async with (
			get_db() as db,
			KyooClient() as client,
		):
			scanner = Scanner(client, RequestCreator(db))
			# there's no way someone else used the same id, right?
			is_master = await db.fetchval("select pg_try_advisory_lock(198347)")
			if is_master:
				_ = await asyncio.create_task(scanner.scan(remove_deleted=True))
				_ = await asyncio.create_task(scanner.monitor())
			yield


app = FastAPI(
	title="Scanner",
	description="API to control the long running scanner or interacting with external databases (themoviedb, tvdb...)\n\n"
	+ "Most of those APIs are for admins only.",
	root_path="/scanner",
	lifespan=lifespan,
)
