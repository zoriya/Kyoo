import asyncio
import logging
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI

from .client import KyooClient
from .fsscan import Scanner
from .providers.composite import CompositeProvider
from .providers.themoviedatabase import TheMovieDatabase
from .requests import RequestCreator, RequestProcessor

logging.basicConfig(level=logging.INFO)
logging.getLogger("watchfiles").setLevel(logging.WARNING)
logging.getLogger("rebulk").setLevel(logging.WARNING)


@asynccontextmanager
async def lifetime():
	async with (
		await asyncpg.create_pool() as pool,
		create_request_processor(pool) as processor,
		create_scanner(pool) as (scanner, is_master),
	):
		await processor.listen_for_requests()
		if is_master:
			_ = await asyncio.gather(
				scanner.scan(remove_deleted=True),
				scanner.monitor(),
			)
		yield


@asynccontextmanager
async def create_request_processor(pool: asyncpg.Pool):
	async with (
		pool.acquire() as db,
		KyooClient() as client,
		TheMovieDatabase() as themoviedb,
	):
		yield RequestProcessor(db, client, CompositeProvider(themoviedb))


@asynccontextmanager
async def create_scanner(pool: asyncpg.Pool):
	async with (
		pool.acquire() as db,
		KyooClient() as client,
	):
		# there's no way someone else used the same id, right?
		is_master: bool = await db.fetchval("select pg_try_advisory_lock(198347)")
		yield (Scanner(client, RequestCreator(db)), is_master)


app = FastAPI(
	title="Scanner",
	description="API to control the long running scanner or interacting with external databases (themoviedb, tvdb...)\n\n"
	+ "Most of those APIs are for admins only.",
	root_path="/scanner",
	lifetime=lifetime,
)


@app.get("/items/{item_id}")
async def read_item(item_id):
	return {"item_id": item_id}
