import os
from contextlib import asynccontextmanager
from typing import Any, cast

from asyncpg import Connection, Pool, create_pool

pool: Pool


@asynccontextmanager
async def init_pool():
	url = os.environ.get("POSTGRES_URL")
	connection: dict[str, Any] = (
		{
			"user": os.environ.get("PGUSER", "kyoo"),
			"host": os.environ.get("PGHOST", "postgres"),
			"password": os.environ.get("PGPASSWORD", "password"),
		}
		if url is None
		else {"dns": url}
	)
	async with await create_pool(**connection) as p:
		global pool
		pool = p
		yield
		pool = None  # type: ignore


@asynccontextmanager
async def get_db():
	async with pool.acquire() as db:
		yield cast(Connection, db)
