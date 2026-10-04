import json
import os
import re
from contextlib import asynccontextmanager
from logging import getLogger
from typing import Any, cast

from asyncpg import Connection, Pool, create_pool
from opentelemetry import trace

logger = getLogger(__name__)
tracer = trace.get_tracer("kyoo.scanner")

pool: Pool

# asyncpg does not read PGOPTIONS, parse it manually for libpq parity.
# Only -c name=value pairs are honored (e.g. "-c search_path=scanner").
_PGOPTIONS_RE = re.compile(
	r"-c\s+(?P<key>[A-Za-z_][\w.]*)\s*=\s*(?P<val>'(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\"|\S+)"
)


def pgoptions_server_settings() -> dict[str, str]:
	settings: dict[str, str] = {}
	for match in _PGOPTIONS_RE.finditer(os.environ.get("PGOPTIONS", "")):
		value = match.group("val")
		if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
			value = value[1:-1]
		settings[match.group("key")] = value
	return settings


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
	server_settings = pgoptions_server_settings()
	if server_settings:
		connection["server_settings"] = server_settings
	async with await create_pool(**connection) as p:
		global pool
		pool = p
		yield pool
		pool = None  # type: ignore


@asynccontextmanager
async def get_db():
	async with pool.acquire(timeout=10) as db:
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


# because https://github.com/fastapi/fastapi/pull/10353
async def get_db_fapi():
	async with get_db() as db:
		yield db


@tracer.start_as_current_span("migrate")
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
