import json
import os
from contextlib import asynccontextmanager
from logging import getLogger
from typing import Any, cast

from asyncpg import Connection, Pool, create_pool

logger = getLogger(__name__)

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
		yield pool
		pool = None  # type: ignore


@asynccontextmanager
async def get_db():
	async with pool.acquire() as db:
		await db.set_type_codec(
			"json",
			encoder=json.dumps,
			decoder=json.loads,
			schema="pg_catalog",
		)
		await db.set_type_codec(
			"jsonb",
			encoder=lambda data: b"\x01" + bytes(json.dumps(data), encoding="utf8"),
			decoder=lambda data: json.loads(data[1:]),
			schema="pg_catalog",
			format="binary",
		)
		yield cast(Connection, db)


async def migrate(migrations_dir="./migrations"):
	async with get_db() as db:
		_ = await db.execute(
			"""
			create schema if not exists scanner;

			create table if not exists scanner._migrations(
				pk serial primary key,
				name text not null,
				applied_at timestamptz not null default now() ::timestamptz)""",
		)

		applied = await db.fetchval(
			"""
			select
				count(*)
			from
				scanner._migrations
			"""
		)

		if not os.path.exists(migrations_dir):
			logger.warning(f"Migrations directory '{migrations_dir}' not found")
			return

		migrations = sorted(
			f for f in os.listdir(migrations_dir) if f.endswith("up.sql")
		)
		for migration in migrations[applied:]:
			file_path = os.path.join(migrations_dir, migration)
			logger.info(f"Applying migration: {migration}")
			try:
				with open(file_path, "r") as f:
					sql = f.read()
					async with db.transaction():
						_ = await db.execute(sql)
						_ = await db.execute(
							"""
							insert into scanner._migrations(name)
								values ($1)
							""",
							migration,
						)
			except Exception as e:
				logger.error(f"Failed to apply migration {migration}", exc_info=e)
				raise
