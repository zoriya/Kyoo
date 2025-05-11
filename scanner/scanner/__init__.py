import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Annotated

import asyncpg
from fastapi import BackgroundTasks, FastAPI, Security

from .client import KyooClient
from .fsscan import Scanner
from .jwt import validate_bearer
from .providers.composite import CompositeProvider
from .providers.themoviedatabase import TheMovieDatabase
from .requests import RequestCreator, RequestProcessor

logging.basicConfig(level=logging.INFO)
logging.getLogger("watchfiles").setLevel(logging.WARNING)
logging.getLogger("rebulk").setLevel(logging.WARNING)


scanner: Scanner


@asynccontextmanager
async def lifetime():
	async with (
		await asyncpg.create_pool() as pool,
		create_request_processor(pool) as processor,
		create_scanner(pool) as (scan, is_master),
	):
		global scanner
		scanner = scan

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


@app.put(
	"/scan",
	status_code=204,
	response_description="Scan started.",
)
async def trigger_scan(
	tasks: BackgroundTasks,
	_: Annotated[None, Security(validate_bearer, scopes=["scanner.trigger"])],
):
	"""
	Trigger a full scan of the filesystem, trying to find new videos & deleting old ones.
	"""
	tasks.add_task(scanner.scan)
