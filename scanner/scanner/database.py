from contextlib import asynccontextmanager
from typing import cast

from asyncpg import Connection, Pool, create_pool

pool: Pool


@asynccontextmanager
async def init_pool():
	async with await create_pool() as p:
		global pool
		pool = p
		yield


@asynccontextmanager
async def get_db():
	async with pool.acquire() as db:
		yield cast(Connection, db)
