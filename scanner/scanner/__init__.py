import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from psycopg import AsyncConnection
from psycopg_pool import AsyncConnectionPool

logging.basicConfig(level=logging.INFO)
logging.getLogger("watchfiles").setLevel(logging.WARNING)
logging.getLogger("rebulk").setLevel(logging.WARNING)

pool = AsyncConnectionPool(open=False, kwargs={"autocommit": True})


@asynccontextmanager
async def lifetime():
	await pool.open()
	yield
	await pool.close()


async def get_db() -> AsyncConnection:
	async with pool.connection() as ret:
		yield ret


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
