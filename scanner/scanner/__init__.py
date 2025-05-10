import logging
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI

from .client import KyooClient
from .providers.composite import CompositeProvider
from .providers.themoviedatabase import TheMovieDatabase
from .requests import RequestProcessor

logging.basicConfig(level=logging.INFO)
logging.getLogger("watchfiles").setLevel(logging.WARNING)
logging.getLogger("rebulk").setLevel(logging.WARNING)


@asynccontextmanager
async def lifetime():
	async with (
		await asyncpg.create_pool() as pool,
		create_request_processor(pool) as processor,
	):
		await processor.listen_for_requests()
		yield


@asynccontextmanager
async def create_request_processor(pool: asyncpg.Pool):
	async with (
		pool.acquire() as db,
		KyooClient() as client,
		TheMovieDatabase() as themoviedb,
	):
		yield RequestProcessor(db, client, CompositeProvider(themoviedb))


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
